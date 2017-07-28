# Component Registry

`ReciNK` component registry is a way to manage components included during `recink run unit` and `recink run e2e` commands.


# Commands

The registry functionality includes the following commands:

- `recink component add [name...]`
- `recink component remove [name...]`
- `recink component list`

> You should keep in mind that components are scoped by a namespace (default `unit`)


# Why do I Need It?

Please look at the examples bellow to see the difference:

```yaml
before_install:
  - npm install -g recink
  - npm install -g recink-pagespeed
  - npm install -g recink-snyk
  - npm install -g recink-codeclimate
script: recink run unit -c pagespeed -c snyk -c codeclimate
```

VS

```yaml
before_install:
  - npm install -g recink
  - recink component add pagespeed snyk codeclimate
script: recink run unit
```

As you can see it's a more concise and pretty way of doing things you need.


# Gotchas

The hidden feature of having components registered by `ReciNK` registry is having additional
configuration files loaded at runtime. In other words each component registered
with `recink component add {component}` will load the `.recink.yml` configuration file 
stored under `{component}/template/` location.
