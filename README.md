# Introduction

The F5 SDK (JS) provides client libraries to access various F5 products and services. It focuses primarily on facilitating consuming our most popular APIs and services, currently including BIG-IP (via Automation Tool Chain) and F5 Cloud Services.

Benefits:

- Provides hand-written or auto-generated client code to make F5’s APIs/services simple and intuitive to use.
- Handles the low-level details of communication with the API or service, including authentication sessions, async task handling, protocol handling, large file uploads, and more.
- Can be installed using familiar package management tools such as npm.

## Table of Contents

- [Usage](#usage)
- [Ben-Work](#ben-work)
- [User Documentation](#user-documentation)


---

## Ben Work

The high level goal here is to make an HTTP client that supports everything we need to take out tools to the next level.

We were going down the path of moving to axios, but axios doesn't really support the depth of connectivity timings we want to gather and it's just another external dependecny...

The timings will include the following:
```js
    const eventTimes = {
        // use process.hrtime() as it's not a subject of clock drift
        startAt: process.hrtime(),
        dnsLookupAt: undefined,
        tcpConnectionAt: undefined,
        tlsHandshakeAt: undefined,
        firstByteAt: undefined,
        endAt: undefined
    }
```

Using these timings we can log and provide stats about what devices (mainly f5) are responding slower than other or a gathered base line

### Planned features
- Full request timings:
  - Start of request processing
  - Time it took to resolve dns (if needed)
  - Time when TCP connection was completed
  - Time when tls handshake was completed
  - Time when first byte was recieved
  - Time when last byte recieved and connection done
- token timer
  - Read token TTL and utilize for entire lifetime of token
  - refresh automatically as needed
- Service discovery for ATC
  - What services are installed
- IPv6 support
- Support both http and https connections
  - When connecting to an F5 device only HTTPS will be used
  - But there may be use cases where http is necessary for some sort of external connection
- May leave open the option for connecting over a linux socket also...
- Possible support for following redirects
- Support for failed auth events
  - This is to allow the packege to be consumed by any other service, like a command line tool, but also be able to integrate into the vscode extension to clear password cache when authentication fails
- layered functions that do all the work of uploading/downloadin files and capturing ucs/qkviews
- Expand ils rpm installs to monitor restjavad/restnoded processes to complete restart for job completion

---

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

The F5 SDK (JS) is in public preview. Documentation for this SDK is coming soon to [clouddocs.f5.com](https://clouddocs.f5.com/). If you have a specific documentation request, you can file an issue through GitHub.

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
