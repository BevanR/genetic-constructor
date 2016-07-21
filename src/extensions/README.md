The directory handles the client-side extension registry, and retrieving + downloading + rendering extensions.

It fetches data from the server. The server is repsonsible for actually maintaining the list of extensions, and sending the list of client extensions.

The list of extensions is loaded from the server on startup. Extensions are downloaded lazily as needed. Extension manifests must be registered before the extension can register a `render()` function.