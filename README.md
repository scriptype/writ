# Writ şeysi

![screenshot of writ.enes.in](https://user-images.githubusercontent.com/5516876/213273025-dc6a6337-dde1-4111-8fb8-5df28a2e041b.png)


This is my new blog attempt that uses my new cms attempt.
<details>
  <summary><h2>Installing requirements</h2></summary>

These packages should be installed in your computer beforehand:
- Node.js & npm (Download here: https://nodejs.org/en/)
- Git (Download here: https://git-scm.com/)

Use the command line application that your OS provides, and follow these instructions:

```sh
# Use git to clone writ and writ-cms
git clone git@github.com:scriptype/writ.git
git clone git@github.com:scriptype/writ-cms.git

# Install writ-cms dependencies and the writ-cms binary (`writ`)
cd writ-cms
npm i
npm i -g .
```

Now that we got `writ` recognized to our system, we should go back to blog directory:

```sh
# Go back to blog project directory
cd ../writ
```

And,

## Start developing and live editing

```sh
writ start
```

or:

## Build for deployment

```sh
writ build
```
</details>
