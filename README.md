# afj-demo-for-twitter

This is an accompaniment to the medium article "Issuing a Verifiable Credential in 7 Easy Steps".

## How to Run

1. Go to http://play-with-von.vonx.io/
2. Click "Start"
3. In the Top left click "ADD NEW INSTANCE", a terminal window will show up
4. Run the following commands

```
git clone https://github.com/animo/afj-demo-for-twitter
cd afj-demo-for-twitter
docker build -t afj-demo . && docker run -it --rm afj-demo
```
