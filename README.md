# npm-on-filecoin

A wrapper script around `npm` allowing you to `publish` and `install` packages using filecoin and IPFS in a de-centralized fashion.

There are three projects in this repo:
* npm-filecoin: The main project hosting the proxy server and wrapper script
* demo-project: A small project that demonstrates installing a dependecy using npm-filecoin
* demo-lib: A small library with one function that is to be publish and used by the `demo-project`


You can install the `npm-filecoin` project locally by running:
```
cd npm-filecoin
npm install
npm run compile
sudo npm link
```
while inside the `npm-filecoin` repo.

Then, `npm-filecoin` can be used to run any npm commands.

## Installing existing package using IPFS

If you want to install, say `react`, you can run:
```
npm-filecoin install react
```

It feels exactly the same as using the normal `npm` but under the hood it is using IPFS and IPFS gateway.

## Publishing package to IPFS and filecoin

This is based on the [powergate project](https://github.com/textileio/powergate). So you will first need to have the `powergate` project locally which can be done by:
```
git clone git@github.com:textileio/powergate.git
```
Then start the local net, you will need to have [docker](https://www.docker.com/) installed:
```
cd powergate/docker
make localnet
```
To publish a package you can run:
```
npm-filecoin publish <path-to-your-publish-to-filecoin-directory>
```

To test this out we can publish our `demo-lib` package by running:
```
npm-filecoin publish demo-lib/
```

Then you will see an output that is similar to this:
```
Uploaded to powergate, cid: QmRfmFCGTVtdxRraxi2Hf9Hvfk5QDYDtBE7cN5LKEfCJyL, token: cbb129b5-b31b-44a9-8039-64fd7aaba80b
```

In `demo-project`, modify the `package.json` file to look like following:
```
"dependencies":{
     "publish-to-filecoin":"fil://QmRfmFCGTVtdxRraxi2Hf9Hvfk5QDYDtBE7cN5LKEfCJyL+cbb129b5-b31b-44a9-8039-64fd7aaba80b",
      ... the rest
  },
```
i.e. `fil://<cid>+<token>`
And then you can run:
```
cd demo-project
npm-filecoin install
```
And you can used the exported function by doing:
```
const { addOne } = require('demo-lib')
```
# Dependencies
You will require the following to have `npm-filecoin` run properly
* A [powergate](https://github.com/textileio/powergate) server
* A [Filecoin client](https://lotu.sh/)
* An [IPFS node](https://docs.ipfs.io/install/) (Or docker [version](https://hub.docker.com/r/ipfs/go-ipfs))
