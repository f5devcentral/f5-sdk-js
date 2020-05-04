# Introduction

The F5 SDK (JS) provides client libraries to access various F5 products and services. It focuses primarily on facilitating consuming our most popular APIs and services, currently including BIG-IP (via Automation Tool Chain) and F5 Cloud Services.

Benefits:

- Provides hand-written or auto-generated client code to make F5’s APIs/services simple and intuitive to use.
- Handles the low-level details of communication with the API or service, including authentication sessions, async task handling, protocol handling, large file uploads, and more.
- Can be installed using familiar package management tools such as npm.

## Table of Contents

- [Usage](#usage)

## Usage

Basic Example:
```javascript
const ManagementClient = require('f5-sdk-js').bigip.ManagementClient;
const AS3Client = require('f5-sdk-js').bigip.extension.AS3Client;

const mgmtClient = new ManagementClient({
    host: '192.0.2.1',
    port: 443,
    user: 'admin',
    password: 'admin'
})
await mgmtClient.login();

const extensionClient = new AS3Client(mgmtClient);
await extensionClient.service.create({ config: {} });
```

Typescript Import Example:
```typescript
import { bigip } from 'f5-sdk-js';

const ManagementClient = bigip.ManagementClient;
const AS3Client = bigip.extension.AS3Client;
```

## Contributor Documentation

A collection of helpful commands have been added to the package manager (npm) scripts directive. Check out the `package.json` for an up-to-date list of commands. 

- Build Package (Typescript -> Javascript): `npm run build-package`
- Build Code Documentation: `npm run build-code-docs`
- Run Unit Tests: `npm run test`
- Run Linter: `npm run lint`

Note that the `main` and `types` package manager directive are pointed at the `dist` folder (where `tsc` builds the package). Please ensure any published packages builds and includes that folder.

## Source Repository

See the source repository [here](https://github.com/f5devcentral/f5-sdk-js).

## User Documentation

F5 SDK JS version 0.9.0 is a public preview. Documentation for this feature is coming soon to [clouddocs.f5.com](https://clouddocs.f5.com/). If you have a specific documentation request, you can file an issue through GitHub.

## Filing Issues and Getting Help

If you come across a bug or other issue when using the SDK, use [GitHub Issues](https://github.com/f5devcentral/f5-sdk-js/issues) to submit an issue for our team. You can also see the current known issues on that page, which are tagged with a Known Issue label.  

F5 SDK is community-supported. For more information, see the [Support page](SUPPORT.md).

## Copyright

Copyright 2014-2020 F5 Networks Inc.

### F5 Networks Contributor License Agreement

Before you start contributing to any project sponsored by F5 Networks, Inc. (F5) on GitHub, you will need to sign a Contributor License Agreement (CLA).  

If you are signing as an individual, we recommend that you talk to your employer (if applicable) before signing the CLA since some employment agreements may have restrictions on your contributions to other projects. Otherwise by submitting a CLA you represent that you are legally entitled to grant the licenses recited therein.  

If your employer has rights to intellectual property that you create, such as your contributions, you represent that you have received permission to make contributions on behalf of that employer, that your employer has waived such rights for your contributions, or that your employer has executed a separate CLA with F5.

If you are signing on behalf of a company, you represent that you are legally entitled to grant the license recited therein. You represent further that each employee of the entity that submits contributions is authorized to submit such contributions on behalf of the entity pursuant to the CLA.
