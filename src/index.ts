import {
  Agent,
  AutoAcceptCredential,
  CredentialEventTypes,
  CredentialPreview,
  CredentialPreviewAttribute,
  CredentialState,
  CredentialStateChangedEvent,
  HttpOutboundTransporter,
  InitConfig,
  serviceTypes,
} from '@aries-framework/core'
import { agentDependencies, HttpInboundTransport } from '@aries-framework/node'
import { Schema } from 'indy-sdk'
import { BCOVRIN_TEST_GENESIS } from './util'

const setupHolder = () => {
  const holderConfig: InitConfig = {
    label: 'holder',
    walletConfig: {
      id: 'holder',
      key: 'holder',
    },
    poolName: 'pool-holder',
    genesisTransactions: BCOVRIN_TEST_GENESIS,
    endpoint: 'http://localhost:3000',
    autoAcceptConnections: true,
    autoAcceptCredentials: AutoAcceptCredential.ContentApproved,
  }

  const holder = new Agent(holderConfig, agentDependencies)

  holder.setInboundTransporter(
    new HttpInboundTransport({
      port: 3000,
    })
  )

  holder.registerOutboundTransporter(new HttpOutboundTransporter())

  return holder
}

const setupIssuer = () => {
  const issuerConfig: InitConfig = {
    label: 'issuer',
    genesisTransactions: BCOVRIN_TEST_GENESIS,
    walletConfig: {
      id: 'issuer',
      key: 'issuer',
    },
    poolName: 'pool-issuer',
    endpoint: 'http://localhost:3001',
    publicDidSeed: 'asdfghjklmasdfghjklmasdfghjklmbv',
    autoAcceptConnections: true,
    autoAcceptCredentials: AutoAcceptCredential.ContentApproved,
  }

  const issuer = new Agent(issuerConfig, agentDependencies)

  issuer.setInboundTransporter(
    new HttpInboundTransport({
      port: 3001,
    })
  )

  issuer.registerOutboundTransporter(new HttpOutboundTransporter())

  return issuer
}

const registerSchema = (agent: Agent) =>
  agent.ledger.registerSchema({
    name: `Gym membership ${new Date().getUTCMilliseconds()}`,
    version: '1.0.0',
    attributes: ['Start date', 'Tier'],
  })

const registerCredentialDefinition = (agent: Agent, schema: Schema) =>
  agent.ledger.registerCredentialDefinition({
    schema,
    tag: 'latest',
    supportRevocation: false,
  })

const offerCredential = async (agent: Agent, credentialDefinitionId: string, connectionId: string) => {
  const credentialPreview = CredentialPreview.fromRecord({
    'Start date': '20/08/2021',
    Tier: 'gold',
  })

  await agent.credentials.offerCredential(connectionId, {
    credentialDefinitionId: credentialDefinitionId,
    preview: credentialPreview,
  })
}

const main = async () => {
  console.log('Holder: setting up the agent...')
  const holder = setupHolder()
  console.log('Issuer: setting up the agent...')
  const issuer = setupIssuer()

  console.log('Holder: initializing the agent...')
  await holder.initialize()
  console.log('Issuer: initializing the agent...')
  await issuer.initialize()

  console.log('Holder: listening for incoming credentials...')
  holder.events.on(CredentialEventTypes.CredentialStateChanged, async ({ payload }: CredentialStateChangedEvent) => {
    if (payload.credentialRecord.state === CredentialState.OfferReceived) {
      console.log('Holder: received a credential offer!')
      holder.credentials.acceptOffer(payload.credentialRecord.id)
    }
  })

  console.log('Issuer: listening for credential changes...')
  issuer.events.on(CredentialEventTypes.CredentialStateChanged, async ({ payload }: CredentialStateChangedEvent) => {
    if (payload.credentialRecord.state === CredentialState.Done) {
      console.log('The credential has been issued and verified by both parties')
      process.exit()
    }
  })

  console.log('Holder: creating an invitation...')
  const { invitation } = await holder.connections.createConnection()

  console.log('Issuer: receiving an invitation...')
  const connectionRecord = await issuer.connections.receiveInvitation(invitation)

  console.log('Issuer: registering a schema on the ledger...')
  const schema = await registerSchema(issuer)

  console.log('Issuer: registering a credential definition on the ledger...')
  const credentialDefinition = await registerCredentialDefinition(issuer, schema)

  console.log('Issuer: offering a credential...')
  await offerCredential(issuer, credentialDefinition.id, connectionRecord.id)
}

main()
