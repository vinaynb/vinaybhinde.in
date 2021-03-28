---
title: Learnings - JSON Web Tokens (JWT)
excerpt: 'Documentation of my thoughts and learnings while understanding JSON Web Tokens'
---

**What this article is not about**

-   Tutorial or a structured guide on using JWT

**What this article is about**

-   My learnings and conclusions about using JWT on backend/frontend
-   Basics of JWT
-   Advice on using JWT in frontend applications
-   Some security aspects related to JWT
-   Use cases for JWT

I have known and worked with JWT's for quite some time now and I am fairly exposed to how they work and when they should be used. But as you work across the stack and with different problems, you at times get out of touch with the concept/tool. A few weeks back I had to design an auth flow for one of the frontend applications that I was working on and it involved authentication with a different system within the same organization, but one that was worked on by another team.

So we had to design how the authentication between our systems and theirs would take place and how would be bringing users authenticated from their systems to our frontend application. And due to the stateless and easily distributable nature of JWT, we decided to use them for the authentication flow. Before going further I wanted to brush up on my knowledge regarding JWT's and this article is a result of that effort.

## Table of contents

-   [Basics](#basics)
-   [Common operations with JWT](#common-operations-with-jwt)
-   [Storing JWT on frontend](#storing-jwt-on-frontend)
-   [Force invalidate JWT](#force-invalidate-jwt)
-   [JWT Use cases](#jwt-use-cases)

## Basics

To start with the definition from [Auth0.com](https://auth0.com/docs/tokens/json-web-tokens) is a good introduction for JWT's

> JSON web token (JWT), pronounced "jot", is an open standard (RFC 7519) that defines a compact and self-contained way for securely transmitting information between parties as a JSON object.

Further, in that article on Auth0, there is an important sentence that says that "All JWT's are tokens but the vice versa is not true". The reason behind this is that JWT's have a fixed structure and only tokens that conform to that structure can be considered as valid JWT.

### Example JWT (encoded on the left and decoded on the right)

{% image "/assets/images/jwt-structure.jpg" "JWT Structure sample from jwt.io" %}

JWT token can be essentially broken up into 3 main parts:

1. Header - This section contains metadata about the token itself
    - alg
        - This is the algorithm to be used to generate Signature(the 3rd part of JWT). More on that below
    - typ
        - set this value to "JWT" and forget it.
2. Payload
    - This is basically a Javascript object which contains some specific properties and user-defined data.
    - Important specific properties and their meanings
        - iss: issuer of the token
        - exp: expiry of the token which is a Unix timestamp. Token older than this value is considered invalid
        - sub: subject of the token (can be any string)
        - aud: identifies the recipient of this token (again a string)
    - Apart from the above anything that can be serialized into JSON can be placed inside here but of course, you don't want to dump 1000 rows from the database into this. This section is referred to as the "claim" in the spec.
3. Signature
    - Digital signature of the token allows one to validate the token.
    - Formula by which the signature is calculated is as below

```js
const signature = hashingAlgorithm(base64(header) + base64(payload) + secret)
```

Let's understand what role does that signature field play in the whole scenario and why is it required. If you prefer the definition of JWT at the beginning of this article it says that it is a way to securely transmit information between two parties. Now if there are 2 parties involved, one must be able to make sure that it's the other party that has sent that message and not any random stranger. Also, they must be sure that the message has not been tampered with on the way by someone else before it reached the destination. Signatures exist to fulfill that exact purpose.

> Signature on a JWT serves the purpose of data integrity and authenticity of a message

Notice the function `hashingAlgorithm` in the formula to calculate the signature. This algorithm is specified in the Header section of the token.

### Composition of encoded JWT

{% image "/assets/images/jwt-encoded-composition.png" "Encoded JWT composition" %}

As it is pretty much clear from the above image that `Header` and `Payload` are base64 encoded while the `Signature` is encrypted. Now to those who are not familiar with base64 encoding, it is an encoding method used to convert textual data into binary data and vice versa. This encoding is majority used to convert textual data into binary and then transmit it over the network as it is considered more reliable to transmit base64 than actual text. More info on [Wikipedia](https://en.wikipedia.org/wiki/Base64).

What this means is that it is very easy for someone to decode the base64 parts of the JWT shown above. It requires no password, no secret salt, or anything like such to decode the token. Heck, there are tons of tools online available to do this for you.

But the Signature is different from the other two as it is a result of a one-way hash using an algorithm. More on this later.

## Common operations with JWT

While there are many operations one can do when dealing with JWT tokens, below are the top 3 that I think application developers deal with most of the times in course of the development

### Creating a signed JWT token

Creating a token involves base64 encoding header and payload and generating a signature using hashing algorithm involving a secret string. Below is a sample code to do so in Node.js. There are SDK's available for many languages and they can be explored [here](https://jwt.io/)

```js
var jwt = require('jsonwebtoken')
jwt.sign(
    {
        foo: 'bar', //custom data, can have anything in here
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
        iss: 'abc.com',
        aud: 'xyz.com'
    },
    'secret',
    { algorithm: 'RS256' },
    function(err, token) {
        console.log(token)
    }
)
```

Important points to note about this operation

-   Signed JWT always use a secret string or a private key i.e. some secret stuff that can uniquely identify your identity.
-   As this step involves a `secret` string that cannot be exposed, it is always performed on a server i.e. the backend.
-   It is possible to create a token without a secret string but then such a token would not contain a hashed signature which does not provide us with data integrity and authenticity benefits and this, in most cases defeats the purpose of using JWT's.

### Verify JWT token

Verifying a token means you are essentially checking 2 things

-   Has the token expired?
-   Is the token from a trusted source?
    -   Note - this does not mean that you are verifying the exact identity of the sender. For that, we need tokens that are signed via PKI(public-private key) mechanism. [This article](https://blog.miguelgrinberg.com/post/json-web-tokens-with-public-key-signatures) is a good read if you are looking into something on this subject.

Below is a sample code to verify a JWT token

```js
var jwt = require('jsonwebtoken')

// invalid token
jwt.verify(token, 'secret', function(err, decoded) {
    if (err) {
        console.error(err) // err
    }

    console.log(decoded) // decoded value
})
```

Important points to note about this operation

-   Much like creating a signed token as this step involves a `secret` string that cannot be exposed, it is always performed on a server i.e. the backend.

#### A sample workflow in a web-app to understand create-token and verify-token actions

-   Client(browser) authenticates with backend using credentials
-   Given correct creds, the server creates a signed jwt using a secret `abc` and sends the token to the client
-   Client now uses that token to call API on the server
-   Server, on receiving the token in request first needs to check if it is the same token that is sent to the client earlier
-   To do this it uses the secret `abc` and verifies the token received from the client
-   The token is verified successfully and the server grants access

### Decode JWT token

Below is the sample code for decoding a token using Node.js

```js
var jwt = require('jsonwebtoken')

var decoded = jwt.decode(token)
console.log(decoded) //contents of token
```

The very important distinction which I did not know about until very recently is that **decoding and verifying a JWT token are entirely different operations that serve different purposes**. Many developers are unaware of this fact and this makes them confused about JWT and how they work in general.

Decoding a token is very easy and can be done by anyone almost with very little effort. This is because the contents of the token itself are base64 encoded which can be decoded easily and **it does not require any secret key**.

To stop anyone from decoding your token you need encrypted tokens which again falls into the PKI area as mentioned previously. They have a name in the spec and are known as [JSON Web Encryption (JWE)](https://tools.ietf.org/html/rfc7516)

Important points to note about this operation

-   This operation is usually done on clients for ex: on frontend or in the mobile app
-   Use case for this is that most often we store some basic info in jwt tokens such as user_id or role of the user etc. This information, if made available to the client directly, can save extra API call to the server while also being secure(exposing user_id or role_name is not much of a security risk)

## Storing JWT on frontend

Before going to explore where and how to store JWT on the frontend it is important to understand what is the need to store them?

The answer is - You need to send a jwt token to your server to access API/services hence you need to store the token received once as otherwise before making each API call you will need to get the token first which is waste of time and additional overhead to your application.

Now moving on to where to store JWT on the frontend, here are the common approaches as far as web applications as concerned

-   In memory
-   Local storage
-   Cookies (HTTP only as well)

In-memory is basically pointless generally speaking because once the browser tab is refreshed or the user closes the app and re-open it again, your JWT is lost and the application will have to fetch them again which is not desirable.

Local storage is used by many applications for storing JWT and is better than in-memory storage as the token is persisted to disk on the user's system even after the browser has been closed. In terms of security, it is less secure than HTTP only cookies

Cookies, if not HTTP only can be accessed by client-side code in the browsers and hence that makes them easily exploitable. Using HTTP only cookies make sure that access is removed and as with cookies you have the additional bonus of the browser taking care of forwarding the cookies automatically to all requests made on the valid domains.

There are many discussions around these options in the community and specifically considering the security aspect of the token. Based on my research and experience I have come to the following conclusion:

> As long as your app is vulnerable to XSS attacks, it does not matter where you store your JWT token as all methods are exploitable with varying degrees of effectiveness

Local storage is the easiest to exploit for an attacker looking for your token after which comes in memory and after which comes cookies.

## Force invalidate JWT

This is a very common use case many of the developers face wherein they need the control of forcefully invalidating a token in case of an adverse event such as an attacker gaining access to it or the systems being compromised. In the world of cookies and sessions this is easy to achieve - just remove that affected session id's from whatever datastore you are storing them into and attackers will lose access to your systems as exploited sessions are no longer there.

With JWT this is not the same case. This is because at its very core JWT are `stateless` in nature. The term stateless implying that there is no data store or a cache where the tokens are saved. We simply generate a token and then release it into the wild and forget it. So in case of an event where you need to invalidate tokens generated by you in past, there is simply no way to do it.

> At its core, JWT is a stateless token so considering its stateless nature the truth is that it cannot be invalidated forcefully

So hypothetically if someone steals your token, the attacker basically can then use that token and do whatever actions that token allows in your system until it expires.

There are some techniques that developers employ to mitigate this but all of them tamper with the stateless nature of jwt in one way or the other. The common ones employed are as follows

-   Store the token in the database
    -   Makes JWT stateful and no different than cookies.
-   Maintain a JWT blacklist
    -   Again forces you to maintain some state and share it with all your systems that use JWT
-   Change secret key which generates signed JWT
    -   The only solution which does not tamper with the stateless nature of JWTs but picture this - You have 1000 users and 1 of them gets exposed. You change the secret key to prevent unauthorized access for that 1 user but due to this the other 999 users too get logged out and need to get JWT again. I do not think you would have a happy time with this.

## JWT Use cases

Valid use cases for JWT's

- Client-server authentication where clients are of different types such as web browsers, mobile apps, desktop apps, etc
- Server to server authorization

Not so valid use cases for JWT's

- User sessions
- Client-server authentication when your clients are web browsers (hint use sessions with cookies) 

There are a plethora of discussions around the valid use cases of JWT's and the majority of them revolve around incorrect usage of JWT's for user sessions. I have used them for user sessions at the time when I and my coworkers were not fully aware of what JWT was and how they work. I'll leave the discussion on this topic out of this article as there are many well-written posts available in the community that explains things in detail and way better than I could here. The links to some of these posts are in the reference section below.

That is a wrap for all things JWT. If you have reached here then I hope this article introduced you to something you didn't know about JWT's before. If you think there is something terribly wrong written about JWT in here I would be happy to listen to it and make amends. I am available over [Twitter](https://twitter.com/vinayn_b) and [email](mailto:vinaynb@gmail.com)

Thanks for reading!

## References

- https://blog.logrocket.com/jwt-authentication-best-practices/
- https://developer.okta.com/blog/2017/08/17/why-jwts-suck-as-session-tokens
- https://jwt.io/
- https://tools.ietf.org/html/rfc7519
- https://auth0.com/docs/tokens/json-web-tokens
- https://softwareengineering.stackexchange.com/questions/373109/should-we-store-jwts-in-database
- https://blog.miguelgrinberg.com/post/json-web-tokens-with-public-key-signatures
- https://stackoverflow.com/questions/60538047/jwt-private-public-key-confusion
- https://medium.com/jspoint/so-what-the-heck-is-jwt-or-json-web-token-dca8bcb719a6