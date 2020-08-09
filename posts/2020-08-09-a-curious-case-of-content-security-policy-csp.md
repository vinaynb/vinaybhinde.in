---
title: Curious case of Content Security Policy (CSP)
excerpt: 'A story about how a breaking change in Helmet npm package broke one of my frontend projects and my learnings about Content Security Policy feature in browsers.'
---

This is a blog post about a recent incident I faced on one of my projects and my learnings after fixing the issue. The project in question is a frontend web app built using React.js. It was hosted on AWS in a docker running on EC2 and all the static assets were being served from AWS Cloudfront.

It was a regular afternoon and I was working on writing some scripts in Node.js to automate a manual task when a friend pinged me that a frontend project that we both worked on (I had since moved on to other projects) was suddenly broken and the web app did not open in the browser.

I quickly asked him to share the link (I did not remember the DNS too after moving on) and sprang up a new tab in Chrome and hit enter. The page was white and nothing changed. No spinner in the tab meant Chrome was done loading assets and there was nothing more for it do be done. The app was indeed broken and my friend was correct.

So the next step in figuring out what was wrong was to hit open the browser dev tools and check if there are any errors reported in console or any assets not being loaded etc. I sprang open dev tools by pressing F12 and selecting the Console tab to check for issues. It had red all over. There were quite a dozen or probably more errors. It looked something like this.

![Errors in browser console](/assets/images/curious-case-of-csp-1.png)

From all the errors I could sense one term had a high rate of occurrence - `Content Security Policy`

So it was the time to find out what the heck was this Content Security Policy. Not that I hadn't heard of it, I vaguely remember it had to do something with securing your webpages. The most glaring question at the moment was why was this breaking our web app all of sudden?

I had by that point confirmed with my friend that no breaking changes apart from those in regular feature development had been made. No changes to the CI build cycle too. And here comes the interesting part - the app used to work just a week back.

So no changes and it used to work a week back. I guessed some external factors at play here. The first doubt went to Google Chrome's newer releases. Though I heavily doubted Chrome team would go for such a breaking change that can leave thousands of web pages broken, it was more of discovering something problematic that was bad for the web in general and Chrome being the nice advocate of the web, had stopped rendering our site so that we can clean up our act.

Before checking Chrome's release changelog, I thought of checking it once in some other browser. So I popped up Firefox and saw the same error cropping up in the dev tools. The app was broken and it was not just Chrome.

With no clear evidence of why this was happening yet, I decided for the sake of my curiosity to check Chrome's release changelog. Quite a few new impressive things, some things I don't care for (yet!), etc etc. Nothing caught my eye that could be the reason for my broken app. So I closed the tab and was by then sure the browsers were not at fault here.

Till that point of time, I had already Googled "Content Security Policy" once and did have the [MDN article on CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) opened in one of my tabs. I had a cursory glance over it and read what it does and there were examples of some sample strings that make up a part of the policy. But I didn't drop down into the details as then I was being lazy and in a hurry to somehow fix it by a small tweak somewhere without much effort. **This was not the correct approach and never is**. More on that later.

Time to bring up the ultimate arsenal for any developer:

> Google search the error keyword along with your tech/tool!

The quick hammering of keywords into Google search box was on the way, the first one being "Content Security policy with create-react-app". I made around 5 more such searches after playing with keywords here and there. Quick read many articles, blog posts, and tutorials. Most of them were regarding how to set up a CSP policy for your web app in React or from your build tool (i.e. Webpack nounces) etc etc. None of them gave me an answer to why my web app was suddenly breaking in the middle of the day when it was working very much fine few days back.

This was a signal the debugging process wasn't going in the right direction. I stopped random google searching and took a step back to think and connect the dots from the information I already had. I knew the following

- CSP is a mechanism by which websites/web-apps can inform the browser to not load or execute content/scripts/images etc from the domain(s) other than those the website owners trust. (It is more than that but starters this is enough to know.)
- Somehow my web app was informing the browser to not load the stylesheets and javascript files it needs, from AWS Cloudfront. So the browser simply did not fetch those files and it threw errors for all such requests in the console.
- No js and CSS mean the white screen as the app is basically useless without the two.

The question was:

> How did the app magically attain this capability to inform the browser and supply a CSP? There must be some change somewhere which must have skipped our eyes. 

I decided to double-check the source code for changes. The web app was being served by an Express.js server running inside a docker. I checked the server file too. Nothing seemed out of ordinary.

Exhausted of all options, I decided it was time to dive a little bit deeper in CSP documentation (**this was what I should have done earlier and was the correct approach**). I started reading CSP documentation on MDN and [Google developers](https://developers.google.com/web/fundamentals/security/csp). The specific bit of information I was looking after was how can one enabled or set CSP for a website/app.

I discovered from the documentation that CSP policy can be set by 2 ways

1. By sending `Content-Security-Policy` header from your server when serving a webpage
2. Using `<meta>` tags in your document.

Reading the first point a lot of bulbs went off in my mind. As I had set up the CI system for this particular front-end and know the in and out's of how the frontend is being deployed and served in production I immediately recognized a culprit who was secretly breaking our frontend. That culprit most probably was [Helmet](https://github.com/helmetjs/helmet) 3rd party package that we had used to help secure Express server with various HTTP headers. It was time to gather some proof to prove the theory.

As I was pretty certain there was no code change in Express server config, I quickly opened up the Helmet package release log and got the proof I was looking for. They had released a new major version 4.0.0 a few days back (major version means there are breaking changes. This is semver practice. Read [this](https://semver.org/) to know more about that). Reading the [upgrade guide to Helmet 4.x from helmet 3.x](https://github.com/helmetjs/helmet/wiki/Helmet-4-upgrade-guide#what-changed-in-the-content-security-policy-middleware) made it all crystal clear.

![Helmet 4.0.0 CSP default policy change](/assets/images/curious-case-of-csp-2.png)

> From version 4.0.0 onwards Helmet middleware sets a default CSP policy header in response to all requests that pass through the middleware.

### So why was this package allowed to update to a new major version?

It was easy for the reason for this. The `package.json` had helmet version listed as `^3.x.x`, the leading carat symbol (i.e. ^) indicating that if a newer major version was available, npm would automatically install it without asking you. Hence as soon as the Helmet team released 4.0.0 on 2nd August, the very next build of our frontend app which runs `npm install` command in our build tool every time there is a push in the master branch, would fetch helmet v4.x. **This explained why the app worked a week back**.

Consequently, our main HTML page (i.e index.html) which was served from Express, returned a CSP header informing the browser to allow loading scripts and styles only from the origin domain itself (i.e. the domain index.html was being served from). Hence browser blocked all our CDN requests and this broke the app.

## Conclusions

This was the short story of how a breaking change in 3rd party code can leave your app/website broken. Although the Helmet guys most probably would have a rationale behind this change and it indeed beefs up your app security, this is not particularly good to have issues in the middle of a deployment of a critical project!

On the flip side, it forced us to rethink what 3rd party code gets loaded into our webpage and we could have a better idea of what was required and what was not. We tailor-made our CSP policy by adding our AWS Cloudfront domains and other attributes required by our app and soon it was all hale and hearty again. As a frontend dev, it gives you a better feel to have some strict security instead of having it all open and waiting for disaster to strike and then act,

## My recommendations about setting up a CSP

There are quite a few articles, tutorials, and amazing guides from Google and MDN that I linked earlier in this article where you can study in detail about CSP and figure out what is right for your web app. But I feel below are some things you must have right now to start with at least.

- Be very specific and strict about what domains you trust and only allow loading scripts and stylesheets from those domains only. Example CSP policy for such a use case is below. This policy is what is currently set up on my website. It allows loading scripts and stylesheets from my domain (i.e. vinaybhinde.in) and 2 others that are for Google Analytics and Google Tag Manager
```
Content-Security-Policy = "default-src 'self' 'unsafe-inline' https://www.google-analytics.com https://www.googletagmanager.com;"
```
- Do not allow arbitrary inline script evaluation and execution if not absolutely required. If you cannot avoid this, at least have trusted domains set up so that you have some basic protection enabled.

If you are working on applications that are of sensitive nature i.e. Banking, Online examinations, Health or Insurance related apps, Defence, etc., having a CSP policy in place makes even more sense. 

> Do not leave the door open if you do not wish to completely close it at least have a good lock in place!

I think there are a lot more security best practices from a frontend perspective that I have come to recall and a new post dedicated to the topic would be a better thing to do.

Thank you for reading this through. Want to discuss/point out an error? Let's catch up on [Twitter](http://twitter.com/vinayn_b)/[Email](mailto:vinaynb@gmail.com).