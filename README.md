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

If you want to install, say `react`, you can run:
```
npm-filecoin install react
```



