Client Extensions

The Constructor web application is bootstrapped with knowledge of all the plugins available on the server, but they are initialized lazily as needed (i.e. `package.json` manifest available, `index.js` loaded when needed).

## Format

Extensions are expected to be NPM modules. They must provide:

- an entrypoint of `index.js` which is responsible for calling `window.constructor.extensions.register(extensionKey, render)`. The format of the render function is given below. The Genetic Constructor server will only serve `index.js` - you must host other files externally if they are to be loaded lazily.

- package.json with fields `name`, `version`, `geneticConstructor`. `geneticConstructor` must include the field `region` (defined below), and optionally `readable`, `description`, etc.

#### Example

There are several examples in `/extensions/`. Here is a simple one:

```json
{
  "name": "simple",
  "version": "1.0.0",
  "description": "Simple Genetic Constructor Extension Example",
  "geneticConstructor": {
    "region": null
  }
}
```

## Registering an Extensions

### Region

Client extensions with visual elements register to specific sections of the screen.

#### Valid Regions

Valid regions are listed in `src/extensions/regions.js`

Client extensions must provide `null` if they are not visual

### Example

```javascript
const extensionKey = 'myExtension'; //matches name in package.json
const render = (container, options) => {
    //control the container
    container.innerHTML = '<p>yay</p>';

    //API subscription
    const listener = window.constructor.store.subscribe(function changeHandler() {
        //store listener
    });

    //return a function to call when the component unmounts to perform cleanup
    return listener;
}
window.constructor.extensions.register(extensionKey, render);
```

##### render()

This function is called when the extension is to be loaded. It is passed the container into which the extension is to render. It may be called more than once in a user's session, e.g. if they navigate away from the design page.

Arguments are `container` and `options`

Options include:

```
boundingBox - boundingRect of container element
```

Can pass an unregister() callback (e.g. to clean up listeners)
