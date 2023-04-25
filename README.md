# SmartClientManagement-FrontEnd
### _v.0.1_

This is the master branch of SmartClientManagement frontEnd.
This document decribes the steps to follow to build the project in a Debian/Ubuntu architecture or github page.

## For login
Url: https://devopsachrafou.github.io/smartClientManagement-FrontEnd/
 
```
login :
a.admin
  
Password : 
123456789
``` 

## Features
- Login and logout
- User management
- Role management
- Menu management : Create, View, Update
- Ville management : Create, View, Update
- Pays management : Create, View, Update

## Technologies used
- pipe
- Custom Validators 
- Service, Component, Interface
- Combined Add/Edit in same Modal(Popup)
- Interceptors (authentication, authorization)
- Error handling (code status)
- Loading spinner

(v.10)
// Internationalization (i18n)

## Tech
SmartClientManagement frontEnd uses a number of open source projects to work properly:
- [Angular CLI v12.0.0]
- [Node.js v16.15.1]
- [npm v8]

## Setup & Getting started

1. Install [NodeJS](http://nodejs.org/) (If you done have)

2. If you have not installed angular yet,

#Install angular globally

```
$ npm install -g @angular/cli@12.0.0-rc.2
```

3. Clone porjet FrontEnd

```
$ ng clone https://github.com/DevOpsAchrafOu/smartClientManagement-FrontEnd
```

4. navigate to smartClientManagement-FrontEnd/ directory.

```   
$ cd smartClientManagement-FrontEnd 
```

5. then install dependencies

```
$ npm install
```

6. Serve the application using (run dev)


6. Getting started

Run `ng serve` for a dev server.
 
```
$ ng serve
```

#Navigate to `http://localhost:4001/`. The app will automatically reload if you change any of the source files.

### Building the project and Deploy Angular App to github page

1. Run `ng build` to build the project.
```
$ ng build --output-path docs  --prod --base-href './'
```
 The build artifacts will be stored in the `docs/` directory. Use the `--prod` flag for a production build and Use the `--output-path` for a change path.

2. create .htaccess file & add variables:

- create file `Nouveau Document texte.txt` & re-name it to `.htaccess`
- set your desired variable value
```
<IfModule mod_rewrite.c>
  RewriteEngine On

  RewriteCond %{DOCUMENT_ROOT}%{REQUEST_URI} -f [OR]
  RewriteCond %{DOCUMENT_ROOT}%{REQUEST_URI} -d
  RewriteRule ^ - [L]
  RewriteRule ^ /index.html
  RewriteRule ^ /404.html
</IfModule>
```
3. After copy/paste .htaccess file in build folder(docs)

## Deploy smartClientManagement-FrontEnd

# Deploy Angular smartClientManagement-FrontEnd App to github page

1. After copy/paste .htaccess file in build folder(admin)

2. Watch this video : https://www.youtube.com/watch?v=aT3yBPxkH7s&t=36s


### Building the project and Deploy Angular App to server Debian/Ubuntu 

### Building the project

1. Run `ng build` to build the project.
```
$ ng build --prod --base-href '/smartClientManagement-FrontEnd/’
```
 The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.
 

2. create .htaccess file & add variables:

- create file `Nouveau Document texte.txt` & re-name it to `.htaccess`
- set your desired variable value
```
<IfModule mod_rewrite.c>
    RewriteEngine on
    RewriteCond %{REQUEST_FILENAME} -s [OR]
    RewriteCond %{REQUEST_FILENAME} -l [OR]
    RewriteCond %{REQUEST_FILENAME} -d
    RewriteRule ^.*$ - [NC,L]
    RewriteRule ^(.*) /smartClientManagement-FrontEnd/index.html [NC,L]
</IfModule>
```
3. After copy/paste .htaccess file in build folder(smartClientManagement-FrontEnd)

## Deploy smartClientManagement-FrontEnd

# Deploy Angular smartClientManagement-FrontEnd App to Apache Server

!. Install Apache2:
Install from here: http://httpd.apache.org/docs/current/install.html

2. Copy the dist/smartClientManagement-FrontEnd folder in /var/www/ folder.


## License

SmartClientManagement - copyright - 2023-2024
