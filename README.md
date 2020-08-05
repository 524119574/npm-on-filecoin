# npm-on-filecoin

A wrapper script around `npm` allowing you to `publish` and `install` packages using filecoin and IPFS in a de-centralized fashion.

There are two projects in this repo:
* npm-filecoin: The main project hosting the proxy server and wrapper script
* demo-project: A small project that demonstrates installing a dependecy using npm-filecoin


You can install the `npm-filecoin` project locally by running:
```
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

And then you can publish you package by running:
```
npm-filecoin publish <path-to-your-package>
```
To test this out we can create a dummy package by running:
```
mkdir publish-to-filecoin
cd publish-to-filecoin
npm init // then you can just all used the default setting
```
And then you can create a `index.js` in the root directory and create a silly function such as:
```
export const addOne = (n) => n + 1
```
So you can do:
```
npm-filecoin publish <path-to-your-publish-to-filecoin-directory>
```
Then you will see an output that is similar to this:
```
Uploaded to powergate, cid: QmRfmFCGTVtdxRraxi2Hf9Hvfk5QDYDtBE7cN5LKEfCJyL, token: cbb129b5-b31b-44a9-8039-64fd7aaba80b
```

In another npm project, modify the `package.json` file to look like following:
```
"dependencies":{
     "publish-to-filecoin":"fil://QmRfmFCGTVtdxRraxi2Hf9Hvfk5QDYDtBE7cN5LKEfCJyL+cbb129b5-b31b-44a9-8039-64fd7aaba80b",
      ... the rest
  },
```
And then you can run:
```
npm-filecoin install
```
And you can used the exported function by doing:
```
const { addOne } = require('publish-npm-filecoin')
```
# Dependencies
You will require the following to have `npm-filecoin` run properly
* A [powergate](https://github.com/textileio/powergate) server
* A [Filecoin client](https://lotu.sh/)
* An [IPFS node](https://docs.ipfs.io/install/) (Or docker [version](https://hub.docker.com/r/ipfs/go-ipfs))
