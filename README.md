# asl-permissions

## About

Microservice that resolves user's permissions to perform tasks

## Usage

To run a local instance:

```
npm run dev
```

The service will respond to GET requests to `/:task` with either a 200 or 403 status code accordingly. Any additional parameters can be sent as query string params. It must be called with an access token provided by keycloak.

It does this by loading the permissions associated to the current user from the postgres database, and resolving according to the local permissions matrix.

## Dependencies

* `@asl/service/api` provides the common api boilerplate - body-parsing, auth etc.
* `@asl/schema` provides models for interacting with database objects

## Configuration

The service can be configured for local development by setting environment variables in a `.env` file.

The following environment variables are required:

* `DATABASE_NAME` - the name of your postgres database
* `KEYCLOAK_REALM` - the keycloak realm used for authentication
* `KEYCLOAK_URL` - the url of the keycloak server
* `KEYCLOAK_CLIENT` - the client name used to authenticate with keycloak
* `KEYCLOAK_SECRET` - the secret used to authenticate with the keycloak client

The following environment variables can be optionally defined:

* `PORT` - port that the service will listen on - default `8080`
* `DATABASE_HOST` - hostname of the postgres instance - default `localhost`
* `DATABASE_PORT` - port of the postgres instance - default `5432`
* `DATABASE_USERNAME` - username of the postgres instance - default `undefined`
* `DATABASE_PASSWORD` - password of the postgres instance - default `undefined`
* `CACHE_TTL` - ttl for cache, if not set will disable caching - default `undefined`
* `REDIS_HOST` - hostname for redis cache store
* `REDIS_PORT` - port for redis cache store
* `REDIS_PASSWORD` - password for redis cache store

## Caching

An optional cache can be configured by defining a `CACHE_TTL` environment variable. This will attempt to connect to a redis instance to store cache entries, but will fall back to an in memory cache if redis is not configured or cannot connect.

### Permissions configuration

The allowed roles for each task are defined in [config.js](./config.js). Adding a role to a task grants permission to perform that task to users with that role.

## Connected services

### Upstream

* `asl-public-api` - licensing data api

### Downstream

The following services must be available in order to run:

* `postgres` - store of profile data

## Development

### Database setup

Scripts for setting up a local database with dev data are available in the [`asl-schema` project](https://github.com/ukhomeoffice/asl-schema). First clone that repo and install the dependencies. Then run the following commands:

To setup the inital table schemas:

```
npm run migrate
```

To seed the database with a development dataset:

```
npm run seed
```

_Note: these scripts will require the database described by `DATABASE_NAME` to be created before they can run._

### Testing

Project contains a set of unit tests driven by `supertest` to make mock requests to the API. To run these:

```
npm test
```

#### Mocking test users

The tests utilise a mock of the `Profile` model's query methods to return a custom mock profile per test.

For example, to run a test with user who has a `basic` role in establishment with an `id` of `100`:

```js
stubProfile(this.api.db.Profile, {
  establishments: [
    {
      id: '100',
      role: 'basic'
    }
  ]
});
```
