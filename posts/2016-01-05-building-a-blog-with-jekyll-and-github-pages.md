---
title: Building a blog with Jekyll and Github pages
excerpt: "This is basically my tale of setting up my old blog(built with Jekyll) and the learnings from the process."
---

Finally here i am with this post detailing my process setting up my blog and in process my first tutorial to the community in general. OK so without getting into much talking let's get to the matter at hand.

**Disclaimer:** With 2+ years of experience under my belt i am hardly a veteran for the web so there may be errors (glaring ones too) or things that i miss out or i am not aware of while writing such articles. Constructive criticisms and suggestions to improve the article are always welcome !
{: .notice}

---

## How can you start a blog ?

First and foremost the blog's are nothing but web pages that run within a browser. Which effectively means you need HTML code to build your blog. You can go about creating your custom HTML pages and add some CSS to them to make them look awesome or you can use tons of free themes out there and get started quickly. In general basically there are two ways to go about setting up a blog. Both these ways basically are concerned around the platform where your blog will live.

- **Using your own server and hosting space**: Write code. Buy a domain name of your liking along with hosting. Go live !


- **Using other Blogging services and providers platforms**: Use Blogging platforms such as [Blogger](ttps://www.blogger.com), [Tumblr](https://www.tumblr.com/), [Github Pages](https://pages.github.com/) etc. or CMS'es such as [Wordpress](https://www.wordpress.com/), [Joomla](https://www.joomla.org/) etc.

This blog is powered by Github Pages and hence i will talking about it in detail. If you need help getting started with other platforms then Google's your friend. 

## What's Github pages ? Don't we use it just to manage and collaborate our source codes ?

There's lot more to Github than just creating source codes repo's and collaborating with other contributers. Github pages is a feature which lets you host your sites/blog's on github's servers, source codes of which are handled as a github repository just like your any other project. Github allows any registered user on its platform for two kinds of websites : 

* [User Pages](https://help.github.com/articles/user-organization-and-project-pages/) 
* [Project Pages](https://help.github.com/articles/user-organization-and-project-pages/) 

User pages are kind of pages which are more or less a personal space of the repository owner or like a personal blog of website of the owner (at least that's what i understood). Whereas project pages are specific to a certain kind of project repo that you have created under your github account.

Speaking in more practically terms and in case of a individual developer like myself, if i wanted to create my personal blog using github pages i will go for a user page but if i have developed a small js library say for image cropping which i am open sourcing and i want a special page for, i would go for a project page.

User pages are hosted by default on *githubusername.github.io* (which in my case becomes vinaynb.github.io) domain. Also you need to create a special repo in github with same name as the domain name previously mentioned to let github know that you wish to publish your user page. Github allows for only one user page website but you can create infinite number of project pages. You can find more differences between User pages and Project pages in github pages guide [here](https://help.github.com/categories/github-pages-basics/).

## Why Jekyll?

Two primary reasons why i went ahead with Github & Jekyll.

* I am familiar with github and git for version control and hence the idea of using the same mechanism for my personal blog publishing too seemed exciting.
* The only static site generator github supports inside out is Jekyll.

I did not at all consider any of the technical aspects of what Jekyll does, heck i did not even know this static site generator thing until recent past. I googled on for few good themes for github pages in the community as i didn't wanted to code my blog from scratch. Found [this](https://github.com/hmfaysal/Notepad) theme by [hmfaysal](https://github.com/hmfaysal) to be beautiful and slick, downloaded the source from github, initialized a git repo and fired few commands to set up Jekyll locally on my machine. There i was in few hours with my decent looking blog live on the web.

Although there some initial troubles in building the blog on github but eventually i managed to get it through with some troubleshooting. After writing my first post i tried to know more about Jekyll and the advantages of such static sites over dynamic ones and below are the few points which i picked up :

* Static sites are waaaaay more light weight and are blazing fast to load over your connection. Reasons are obvious. No server side processing.
* They are perfect for use cases such as personal websites or blog's because of the static content in these kinds of websites.
* You don't need to set up databases and configurations and all that stuff. Open your editor, write down your stuff in plain old text with just some additional formatting and you're done.
* Version control with git. No need of periodic db backups. Git does it automatically for you.
* If you are concerned about security then static sites are about as secure as possible unless of course you give away your FTP details.
* You have the entire control of your site from the HTML structure to the components, widgets, styling and positioning of all the components everything is freely and easily customizable. Same is not the case in Wordpress.

I am still figuring out how Jekyll exactly works and processes your text into a web page and how do you customize it. But it has been fairly easy and fun process compared to when i was trying to build a website using Wordpress or other content management systems. Do note that if you use github pages to power your blog, the entire source code for your blog is open to the community and anyone can view it just by navigating to your blog repository. So it's a big no-no to use github pages if you intend to use your blog or website for use cases such as financial transactions.

## Step by step guide to publish a github user page

1. Set up a Github account if you don't have one from [here](https://github.com/join)
2. As we are creating a user page, go ahead and create a repository while naming it in this specific format *githubusername.github.io*. In my case the repo name is *vinaynb.github.io*
3. Clone the repository into your local machine using the following commands from terminal
   {:.bash}
       git clone https://github.com/username/username.github.io
   {:.notice} 
4. Download the theme from github repo and copy the contents into your repository folder that was created after you cloning.
5. Below is what your folder structure look like after following above steps.   
   ![Final Directory structure]({{ site.url }}/images/posts/jekyllDirStructure.png){: .img-responsive }
6. All your configuration settings for your jekyll website are located on a file named **_config.yml**. This if from where you will specify global settings such as title of the blog, author details, URL path variables, markdown plugin being used, google analytics etc. Open the file in your favourite editor and look for an variable named **baseurl**. The value of this variable will differ when you are devleping locally and when your site is live. Hence i use two versions as follows with one commented at any point of time.
   <div class="pt15">
   <script src="https://gist.github.com/vinaynb/986ebdfc372e60435d76.js"></script>
   </div>   
7. Keeping the base url to "0.0.0.0", open your terminal and run the below command from the root directory of your repo (in my case root is the folder vinaynb.github.io)
   {:.bash}
       jekyll serve --baseurl
   {:.notice} 
8. If all goes well and you don't get any wierd errors, then you can open your favourite browser and type **localhost:4000** and rejoice in joy seeing your new shiny blog alive !
9. Your blog's ready and alls well, but still it cannot be accessed by anyone over the web so we got to publish it through github over the web. To do that we will have to commit the changes we made to our github repo and push them online using git. To commit changes to your git repo navigate to your root directory and enter following command from the terminal
   {:.bash}       
       git add .
       //stages all modified and new added files       
       git commit -m "your message"
       //commits your staged changes       
       git push origin master
       //pushes all your commits to remote github repo master branch
   {:.notice}
10. Your code is now pushed to your github repo and github will build your site and you should be able to see your blog live at username.github.io. There are a few cases where the build fails on github and you should recieve a email from github describing the reason why the build fails. Unless it is rectified, your blog won't run on github. Common reasons for build failures can be found [here](https://help.github.com/articles/troubleshooting-github-pages-build-failures/)

Thats it ! You have published your website/blog live without the hassle of learning any bulky CMS'S or any frameworks and stuff. Also you don't even need to buy your hosting space !

The freedom, ease of customization, simplicity and performance makes jekyll a attractive option to run your blog on. Do let me know your views and comments about this article or any such stories that you have while you build your own blog in comments below. I'll be happy to hear !