# npm-on-filecoin

This is a wrapper script around `npm` which allows you to `publish` and `install` using filecoin and IPFS.

## Installing existing package using IPFS

You can start the script by running:
```
npm run bin
```
If you want to install, say `react`, you can run:
```
npm run bin install react
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
npm run bin publish <path-to-your-package>
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
npm run bin publish <path-to-your-publish-to-filecoin-directory>
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
npm run bin install
```
And you can used the exported function by doing:
```
const { addOne } = require('publish-npm-filecoin')
```
