---
title: SSL with Github Pages
excerpt: "A guide which documents gotchas you may face when securing your Github Pages website with Cloudflare for free."
---

I recently took the pain of securing my site with SSL by using Cloudflare's free website plan. My site still lives on Github but is now being served via Cloudflare's CDN server and is protected with SSL encryption.

This article does not explain that process i will mention here the original article which i followed. It is written by Christopher Schmitt and is published on [Css Tricks](https://css-tricks.com). Here is the [link](https://css-tricks.com/switching-site-https-shoestring-budget/). His article has all you need to have SSL encryption with your custom domain name hosted on Github. What I am writing here is documentation of issues I faced after migrating over to Cloudflare and solutions to them.

## What all went wrong when I moved to Cloudflare CDN

### Paths

Firstly the evergreen problem. Lots of my scripts, CSS files, 3rd party dependencies (self-hosted as well as those on CDN) and my font files all were failing. The reason was not that they didn't exist at the path where the browser was trying to find them, it was because those particular resources were being loaded over HTTP protocol from my page (which itself is now on HTTPS) and hence they were being blocked by browser due to security considerations.

Browsers have this rule that if you serve an HTML page over https then all the resources that page needs to fetch must be over https as well because otherwise any potential resource-loaded over HTTP can expose you to security risks and you can be compromised. More about this particular feature can be read [here](https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content).

<span class="fix-heading">How to Fix ?</span>

The prime reason here was that my Jekyll theme structure appended all my scripts and CSS files with the string that is stored in URL property inside `_config.yml`. Ironically I did not have such a property in my config file and hence it somehow used my old URL which did not have https in it. So all my assets were being loaded from HTTP while my HTML page was on https.

So to fix this I modified my config file to include a *URL* parameter and supplied my shining new https URL i.e. https.vinaybhinde.in as its value. I also removed the baseUrl option from my config as it was not required there. If you are using a user site on GitHub pages (and not individual project sites) take note that you don't necessarily need to have the baseUrl parameter in `_config.yml` and you can just omit it. Using it without understanding will result in unnecessary path related issues which are a pain to fix.

Next - Git Push and boom, site sprang to Life!

### Cached Resources from Cloudflare

As with any CDN, your static assets are saved on your CDN provider's edge cache servers which enable them to serve your pages at lightning speed. But when developing and publishing your changes this can be a problem as you don't necessarily view the latest version when viewing the site in the browser as your CDN does not know that there have been changes to the site since the last copy it has.

I was trying to debug the URLs paths faced in previously mentioned issues by making some changes but even after making few commits and rebuilding the site the live version didn't have those changes. Then it clicked that it was CDN caching that was always serving the older version as it didn't have the updated files.

<span class="fix-heading">How to Fix ?</span>

Specifically, in Cloudflare, there is an option of `Purge Cache` under the `Caching` menu which lets you tell Cloudflare to re-fetch all or selective files from your origin server (Github in my case) and delete the existing cached files. Once this is done you get your changes in the next refresh. While this gets your job done but when making a couple of changes it becomes cumbersome to repeat this process every time you need to check those changes in a live environment. To your rescue, Cloudflare provides an option called `Development Mode` under the `Caching` menu which when turned on will always serve your site by fetching files from your origin server whenever requested. Hence on each request, it fetches the requested file from origin bypassing its cache and hence you can view your changes instantly.


Just to make it clear if it isn't, the issues I mentioned above were in my code and it has nothing to do with Cloudflare's service which seems good from the initial experience I have had till now. If there's a different issue that you faced in your blog after moving to https let me know in the comments!

Thanks for reading :)