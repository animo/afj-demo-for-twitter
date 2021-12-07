# afj-demo-for-twitter

This is an accompaniment to the medium article "Issuing a Verifiable Credential in 7 Easy Steps".

## How to Run

1. Go to http://play-with-von.vonx.io/
2. Click "Start"
3. In the Top left click "ADD NEW INSTANCE", a terminal window will show up
4. Run the following commands

```sh
git clone https://github.com/animo/afj-demo-for-twitter
cd afj-demo-for-twitter
docker build -t afj-demo . && docker run -it --rm afj-demo
```

If you have docker and git installed you can also run the above commands directly on your computer. The Play with VON just provides a already setup environment to run the demo.


### Apple Silicon Issues

Since there is no build for libindy for arm64 on debian we have to specify that in the `docker build` part.

```sh
docker build -t afj-demo . --platform linux/amd64 && docker run -it --rm afj-demo
```
