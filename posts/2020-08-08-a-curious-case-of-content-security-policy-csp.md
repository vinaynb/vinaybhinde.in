---
title: Curious case of Content Security Policy (CSP)
excerpt: 'A story about how a breaking change in Helmet npm package broke ony of my frontend projects and my learnings about Content Security Policy feature in browsers.'
---

This is blog post about of a recent incident I faced on one of my projects and my learnings after fixing the issue. The project in question is a frontend web app built using React.js. It was hosted on AWS in a docker running on EC2 and all the static assets were being served from AWS Cloudfront.

It was a regular afternoon and I was working on writing some scripts in Node.js to automate a manual task when a friend pinged me that a frontend project that we both worked on (I had since moved on to other projects) was suddenly broken and the web app did not open in the browser.

I quickly asked him to share the link (I did not remember the dns too after moving on) and sprang up a new tab in Chrome and hit enter. The page was white and nothing changed. No spinner in the tab meant Chrome was done loading assets and there was nothing more for it do be done. The app was indeed broken and my friend was correct.

So the next step in figuring out what was wrong was to hit open the browser dev tools and check if there are any errors reported in console or any assets not being loaded etc etc. I sprang open dev tools by pressing F12 and selected the Console tab to check for issues. It had red all over. There were quite a dozen or probably more errors. It looked something like this.

![Errors in browser console](/assets/images/curious-case-of-csp-1.png)

From all the errors I could sense one term had high rate of occurence - `Content Security Policy`

So it was the time to find out what the heck was this Content Security Policy. Not that I hadn't heard of it, I vaguely remember it had to do something with securing your webpages. The most glaring question at the moment was why was this breaking our web app all of sudden ?

I had by that point confirmed with my friend that no breaking changes apart from those in regular feature development had been made. No changes to the CI build cycle too. And here comes the interesting part - the app used to work just a week back.

So no changes and it used to work a week back. I guessed some external factor at play here. The first doubt went to Google Chrome's newer releases. Though I heavily doubted Chrome team would go for such a breaking change that can leave thousands of web pages broken, it was more of discovering something problematic that was bad for web in general and Chrome being the nice advocate of web, had stopped rendering our site so that we can clean up our act.

Before checking Chrome's release changelog, I though of checking it once in some other browser. So I popped up Firefox and saw the same error cropping up in the dev tools. The app was broken and it was not just Chrome.

With no clear evidence of why this was happening yet, I decided for the sake of my curiosity to check Chrome's release changelog. Quite a few new impressive things, some things I don't care for (yet!) etc etc. Nothing caught my eye that could be the reason for my broken app. So I closed the tab and was by then sure the browsers were not at fault here.

Till that point of time I had already Googled "Content Security Policy" once and did have the [MDN article on CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) opened in one of my tabs. I had a cursory glance over it and read what it does and there were examples of some sample strings that make up a part of policy. But I didnt't drop down into the details as at that point of time I was being lazy and in a hurry to somehow fix it by a small tweak somewhere without much effort. **This was not the correct approach and never is**. More on that later.

Time to bring up the ultimate arsenal for any developer:

> Google search the error keyword along with your tech/tool!

Quick hammering of keywords into Google search box was on the way, the first one being "Content Security policy with create-react-app". I made around 5 more such searches after playing with keywords here and there. Quick read many articles, blog posts and tutorials. Most of them were regarding how to setup a CSP policy for your webapp in React or from your build tool (i.e. Webpack nounces) etc etc. None of them gave me an answer why my web app was suddenly breaking in the middle of the day when it was working very much fine few days back.

This was a signal the debugging process wasn't going in the right direction. I stopped random google searching and took a step back to think and connect the dots from the information I already had. I knew the following

- CSP is a mechanism by which websites/web-apps can inform browser to not load or execute content/scripts/images etc from domain(s) other than those the website owners trust. (It is more than that but starters this is enough to know.)
- Somehow my web app was informing browser to not load the stylesheets and javascript files it needs, from AWS Cloudfront. So browser simply did not fetch those files and it threw errors for all such requests in console.
- No js and css means the white screen as app is basically useless without the two.

The question was:

> How did the app magically attain this capability to inform browser and supply a CSP ? There must be some change somewhere which must have skipped our eyes. 

I decided to double check myself