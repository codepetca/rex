# Project Context
Simple multiplayer realtime MVP tic tac toe.
You **MUST** use typescript over javascript whenever possible.
Bun and Hono backend. Svelte 5 and sveltekit frontend.

<SYSTEM>This is the abridged developer documentation for Svelte and SvelteKit.</SYSTEM>

# Svelte documentation

## Svelte

You **MUST** use the Svelte 5 API unless explicitly tasked to write Svelte 4 syntax. If you don't know about the API yet, below is the most important information about it. Other syntax not explicitly listed like `{#if ...}` blocks stay the same, so you can reuse your Svelte 4 knowledge for these.

- to mark something a state you use the `$state` rune, e.g. instead of `let count = 0` you do `let count = $state(0)`
- to mark something as a derivation you use the `$derived` rune, e.g. instead of `$: double = count * 2` you do `const double = $derived(count * 2)`
- to create a side effect you use the `$effect` rune, e.g. instead of `$: console.log(double)`you do`$effect(() => console.log(double))`
- to create component props you use the `$props` rune, e.g. instead of `export let foo = true; export let bar;` you do `let { foo = true, bar } = $props();`
- when listening to dom events do not use colons as part of the event name anymore, e.g. instead of `<button on:click={...} />` you do `<button onclick={...} />`

### What are runes?

- Runes are built-in Svelte keywords (prefixed with `$`) that control the compiler. For example, you write `let message = $state('hello');` in a `.svelte` file.
- Do **NOT** treat runes like regular functions or import them; instead, use them as language keywords.  
  _In Svelte 4, this syntax did not exist—you relied on reactive declarations and stores; now runes are an integral part of the language._

### $state

- `$state` creates reactive variables that update the UI automatically. For example:
  ```svelte
  <script>
    let count = $state(0);
  </script>
  <button onclick={() => count++}>Clicked: {count}</button>
  ```
- Do **NOT** complicate state management by wrapping it in custom objects; instead, update reactive variables directly.  
  _In Svelte 4, you created state with let, e.g. `let count = 0;`, now use the $state rune, e.g. `let count = $state(0);`._
- Arrays and objects become deeply reactive proxies. For example:
  ```js
  let todos = $state([{ done: false, text: 'add more todos' }]);
  todos[0].done = !todos[0].done;
  ```
- Do **NOT** destructure reactive proxies (e.g., `let { done } = todos[0];`), as this breaks reactivity; instead, access properties directly.
- Use `$state` in class fields for reactive properties. For example:
  ```js
  class Todo {
  	done = $state(false);
  	text = $state('');
  	reset = () => {
  		this.text = '';
  		this.done = false;
  	};
  }
  ```

### $state.raw

- `$state.raw` creates shallow state where mutations are not tracked. For example:

```js
let person = $state.raw({ name: 'Heraclitus', age: 49 });
// Instead of mutating:
// person.age += 1;  // NO effect
person = { name: 'Heraclitus', age: 50 }; // Correct way to update
```

- Do **NOT** attempt to mutate properties on raw state; instead, reassign the entire object to trigger updates.

### $state.snapshot

- `$state.snapshot` produces a plain object copy of reactive state. For example:

```svelte
<script>
  let counter = $state({ count: 0 });
  function logSnapshot() {
    console.log($state.snapshot(counter));
  }
</script>
```

- **ONLY** use this if you are told there's a problem with passing reactive proxies to external APIs.

### Passing state into functions

- Pass-by-Value Semantics: Use getter functions to ensure functions access the current value of reactive state. For example:
  ```js
  function add(getA, getB) {
  	return () => getA() + getB();
  }
  let a = 1,
  	b = 2;
  let total = add(
  	() => a,
  	() => b
  );
  console.log(total());
  ```
- Do **NOT** assume that passing a reactive state variable directly maintains live updates; instead, pass getter functions.  
  _In Svelte 4, you often used stores with subscribe methods; now prefer getter functions with `$state` / `$derived` instead._

### $derived

- `$derived` computes reactive values based on dependencies. For example:

```svelte
<script>
  let count = $state(0);
  let doubled = $derived(count * 2);
</script>
<button onclick={() => count++}>{doubled}</button>
```

- Do **NOT** introduce side effects in derived expressions; instead, keep them pure.  
  _In Svelte 4 you used `$:` for this, e.g. `$: doubled = count * 2;`, now use the $derived rune instead, e.g `let doubled = $derived(count * 2);`._

#### $derived.by

- Use `$derived.by` for multi-line or complex logic. For example:

```svelte
<script>
  let numbers = $state([1, 2, 3]);
  let total = $derived.by(() => {
    let sum = 0;
    for (const n of numbers) sum += n;
    return sum;
  });
</script>
```

- Do **NOT** force complex logic into a single expression; instead, use `$derived.by` to keep code clear.

#### Overriding derived values

- You can reassign a derived value for features like optimistic UI. It will go back to the `$derived` value once an update in its dependencies happen. For example:

```svelte
<script>
  let post = $props().post;
  let likes = $derived(post.likes);
  async function onclick() {
    likes += 1;
    try { await post.like(); } catch { likes -= 1; }
  }
</script>
```

- Do **NOT** try to override derived state via effects; instead, reassign directly when needed.  
  _In Svelte 4 you could use `$:` for that, e.g. `$: likes = post.likes; likes = 1`, now use the `$derived` instead, e.g. `let likes = $derived(post.likes); likes = 1;`._

### $effect

- `$effect` executes functions when reactive state changes. For example:

```svelte
<script>
  let size = $state(50);
  $effect(() => {
    console.log('Size changed:', size);
  });
</script>
```

- Do **NOT** use `$effect` for state synchronization; instead, use it only for side effects like logging or DOM manipulation.  
  _In Svelte 4, you used reactive statements (`$:`) for similar tasks, .e.g `$: console.log(size)`; now use the `$effect` rune instead, e.g. `$effect(() => console.log(size))` ._

#### Understanding lifecycle (for $effect)

- Effects run after the DOM updates and can return teardown functions. For example:

```svelte
<script>
  let count = $state(0);
  $effect(() => {
    const interval = setInterval(() => { count += 1; }, 1000);
    return () => clearInterval(interval);
  });
</script>
```

- **Directive:** Do **NOT** ignore cleanup; instead, always return a teardown function when needed.

#### $effect.pre

- `$effect.pre` works like `$effect` with the only difference that it runs before the DOM updates. For example:

```svelte
<script>
  let div = $state();
  $effect.pre(() => {
    if (div) console.log('Running before DOM update');
  });
</script>
```

- Do **NOT** use `$effect.pre` for standard post-update tasks; instead, reserve it for pre-DOM manipulation like autoscrolling.

#### $effect.tracking

- `$effect.tracking` indicates if code is running inside a reactive context. For example:

```svelte
<script>
  $effect(() => {
    console.log('Inside effect, tracking:', $effect.tracking());
  });
</script>
```

- Do **NOT** misuse tracking information outside its intended debugging context; instead, use it to enhance reactive debugging.  
  _In Svelte 4, no equivalent existed; now this feature offers greater insight into reactivity._

#### $effect.root

- `$effect.root` creates a non-tracked scope for nested effects with manual cleanup. For example:

```svelte
<script>
  let count = $state(0);
  const cleanup = $effect.root(() => {
    $effect(() => {
      console.log('Count is:', count);
    });
    return () => console.log('Root effect cleaned up');
  });
</script>
```

- Do **NOT** expect root effects to auto-cleanup; instead, manage their teardown manually.  
  _In Svelte 4, manual cleanup required explicit lifecycle hooks; now `$effect.root` centralizes this control._

### $props

- Use `$props` to access component inputs. For example:

```svelte
<script>
  let { adjective } = $props();
</script>
<p>This component is {adjective}</p>
```

- Do **NOT** mutate props directly; instead, use callbacks or bindable props to communicate changes.  
  _In Svelte 4, props were declared with `export let foo`; now you use `$props` rune, e.g. `let { foo } = $props()`._
- Declare fallback values via destructuring. For example:

```js
let { adjective = 'happy' } = $props();
```

- Rename props to avoid reserved keywords. For example:

```js
let { super: trouper } = $props();
```

- Use rest syntax to collect all remaining props. For example:

```js
let { a, b, ...others } = $props();
```

#### $props.id()

- Generate a unique ID for the component instance. For example:

```svelte
<script>
  const uid = $props.id();
</script>
<label for="{uid}-firstname">First Name:</label>
<input id="{uid}-firstname" type="text" />
```

- Do **NOT** manually generate or guess IDs; instead, rely on `$props.id()` for consistency.

### $bindable

- Mark props as bindable to allow two-way data flow. For example, in `FancyInput.svelte`:

```svelte
<script>
  let { value = $bindable() } = $props();
</script>
<input bind:value={value} />
```

- Do **NOT** overuse bindable props; instead, default to one-way data flow unless bi-directionality is truly needed.  
  _In Svelte 4, all props were implicitly bindable; in Svelte 5 `$bindable` makes this explicit._

### $host

- Only available inside custom elements. Access the host element for custom event dispatching. For example:

```svelte
<script>
  function dispatch(type) {
    $host().dispatchEvent(new CustomEvent(type));
  }
</script>
<button onclick={() => dispatch('increment')}>Increment</button>
```

- Do **NOT** use this unless you are explicitly tasked to create a custom element using Svelte components

### {#snippet ...}

- **Definition & Usage:**  
  Snippets allow you to define reusable chunks of markup with parameters inside your component.  
  _Example:_
  ```svelte
  {#snippet figure(image)}
    <figure>
      <img src={image.src} alt={image.caption} width={image.width} height={image.height} />
      <figcaption>{image.caption}</figcaption>
    </figure>
  {/snippet}
  ```
- **Parameterization:**  
  Snippets accept multiple parameters with optional defaults and destructuring, but rest parameters are not allowed.  
  _Example with parameters:_
  ```svelte
  {#snippet name(param1, param2)}
    <!-- snippet markup here -->
  {/snippet}
  ```

### Snippet scope

- **Lexical Visibility:**  
  Snippets can be declared anywhere and reference variables from their outer lexical scope, including script or block-level declarations.  
  _Example:_
  ```svelte
  <script>
    let { message = "it's great to see you!" } = $props();
  </script>
  {#snippet hello(name)}
    <p>hello {name}! {message}!</p>
  {/snippet}
  {@render hello('alice')}
  ```
- **Scope Limitations:**  
  Snippets are only accessible within their lexical scope; siblings and child blocks share scope, but nested snippets cannot be rendered outside.  
  _Usage caution:_ Do **NOT** attempt to render a snippet outside its declared scope.

### Passing snippets to components

- **As Props:**  
  Within a template, snippets are first-class values that can be passed to components as props.  
  _Example:_
  ```svelte
  <script>
    import Table from './Table.svelte';
    const fruits = [
      { name: 'apples', qty: 5, price: 2 },
      { name: 'bananas', qty: 10, price: 1 }
    ];
  </script>
  {#snippet header()}
    <th>fruit</th>
    <th>qty</th>
    <th>price</th>
    <th>total</th>
  {/snippet}
  {#snippet row(d)}
    <td>{d.name}</td>
    <td>{d.qty}</td>
    <td>{d.price}</td>
    <td>{d.qty * d.price}</td>
  {/snippet}
  <Table data={fruits} {header} {row} />
  ```
- **Slot-like Behavior:**  
  Snippets declared inside component tags become implicit props (akin to slots) for the component.  
  _Svelte 4 used slots for this, e.g. `<Component><p slot="x" let:y>hi {y}</p></Component>`; now use snippets instead, e.g. `<Component>{#snippet x(y)}<p>hi {y}</p>{/snippet}</Component>`._
- **Content Fallback:**  
  Content not wrapped in a snippet declaration becomes the `children` snippet, rendering as fallback content.  
  _Example:_
  ```svelte
  <!-- App.svelte -->
  <Button>click me</Button>
  <!-- Button.svelte -->
  <script>
    let { children } = $props();
  </script>
  <button>{@render children()}</button>
  ```

### Typing snippets

- Snippets implement the `Snippet` interface, enabling strict type checking in TypeScript or JSDoc.  
  _Example:_

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  interface Props {
    data: any[];
    children: Snippet;
    row: Snippet<[any]>;
  }
  let { data, children, row }: Props = $props();
</script>
```

### {@render ...}

- Use the {@render ...} tag to invoke and render a snippet, passing parameters as needed.  
  _Example:_
  ```svelte
  {#snippet sum(a, b)}
    <p>{a} + {b} = {a + b}</p>
  {/snippet}
  {@render sum(1, 2)}
  ```
- Do **NOT** call snippets without parentheses when parameters are required; instead, always invoke the snippet correctly.  
  _In Svelte 4, you used slots for this, e.g. `<slot name="sum" {a} {b} />`; now use `{@render}` instead, e.g. `{@render sum(a,b)}`._

### <svelte:boundary>

- Use error boundary tags to prevent rendering errors in a section from crashing the whole app.
  _Example:_

  ```svelte
  <svelte:boundary onerror={(error, reset) => console.error(error)}>
    <FlakyComponent />
  </svelte:boundary>
  ```

- **Failed Snippet for Fallback UI:**  
  Providing a `failed` snippet renders fallback content when an error occurs and supplies a `reset` function.  
  _Example:_

  ```svelte
  <svelte:boundary>
    <FlakyComponent />
    {#snippet failed(error, reset)}
      <button onclick={reset}>Oops! Try again</button>
    {/snippet}
  </svelte:boundary>
  ```

### class

- Svelte 5 allows objects for conditional class assignment using truthy keys. It closely follows the `clsx` syntax  
  _Example:_

```svelte
<script>
  let { cool } = $props();
</script>
<div class={{ cool, lame: !cool }}>Content</div>
```


# SvelteKit documentation

## Project types

SvelteKit supports all rendering modes: SPA, SSR, SSG, and you can mix them within one project.

## Setup

Scaffold a new SvelteKit project using `npx sv create` then follow the instructions. Do NOT use `npm create svelte` anymore, this command is deprecated.

A SvelteKit project needs a `package.json` with the following contents at minimum:

```json
{
	"devDependencies": {
		"@sveltejs/adapter-auto": "^6.0.0",
		"@sveltejs/kit": "^2.0.0",
		"@sveltejs/vite-plugin-svelte": "^5.0.0",
		"svelte": "^5.0.0",
		"vite": "^6.0.0"
	}
}
```

Do NOT put any of the `devDependencies` listed above into `dependencies`, keep them all in `devDependencies`.

It also needs a `vite.config.js` with the following at minimum:

```js
import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()]
});
```

It also needs a `svelte.config.js` with the following at minimum:

```js
import adapter from '@sveltejs/adapter-auto';

export default {
	kit: {
		adapter: adapter()
	}
};
```

## Project structure

- **`src/` directory:**
  - `lib/` for shared code (`$lib`), `lib/server/` for server‑only modules (`$lib/server`), `params/` for matchers, `routes/` for your pages/components, plus `app.html`, `error.html`, `hooks.client.js`, `hooks.server.js`, and `service-worker.js`.
  - Do **NOT** import server‑only code into client files
- **Top‑level assets & configs:**
  - `static/` for public assets; `tests/` (if using Playwright); config files: `package.json` (with `@sveltejs/kit`, `svelte`, `vite` as devDeps), `svelte.config.js`, `tsconfig.json` (or `jsconfig.json`, extending `.svelte-kit/tsconfig.json`), and `vite.config.js`.
  - Do **NOT** forget `"type": "module"` in `package.json` if using ESM.
- **Build artifacts:**
  - `.svelte-kit/` is auto‑generated and safe to ignore or delete; it will be recreated on `dev`/`build`.
  - Do **NOT** commit `.svelte-kit/` to version control.

## Routing

- **Filesystem router:** `src/routes` maps directories to URL paths: Everything with a `+page.svelte` file inside it becomes a visitable URL, e.g. `src/routes/hello/+page.svelte` becomes `/hello`. `[param]` folders define dynamic segments. Do NOT use other file system router conventions, e.g. `src/routes/hello.svelte` does NOT become available als URL `/hello`
- **Route files:** Prefix with `+`: all run server‑side; only non‑`+server` run client‑side; `+layout`/`+error` apply recursively.
- **Best practice:** Do **not** hard‑code routes in code; instead rely on the filesystem convention.

### +page.svelte

- Defines UI for a route, SSR on first load and CSR thereafter
- Do **not** fetch data inside the component; instead use a `+page.js` or `+page.server.js` `load` function; access its return value through `data` prop via `let { data } = $props()` (typed with `PageProps`).

```svelte
<script lang="ts">
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();
</script>
<h1>{data.title}</h1>
```

### +page.js

- Load data for pages via `export function load({ params })` (typed `PageLoad`), return value is put into `data` prop in component
- Can export `prerender`, `ssr`, and `csr` consts here to influence how page is rendered.
- Do **not** include private logic (DB or env vars), can **not** export `actions` from here; if needed, use `+page.server.js`.

```js
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
  return {
    title: 'Hello world!',
  };
}
```

### +page.server.js

- `export async function load(...)` (typed `PageServerLoad`) to access databases or private env; return serializable data.
- Can also export `actions` for `<form>` handling on the server.

### +error.svelte

- Add `+error.svelte` in a route folder to render an error page, can use `page.status` and `page.error.message` from `$app/state`.
- SvelteKit walks up routes to find the closest boundary; falls back to `src/error.html` if none.

### +layout.svelte

- Place persistent elements (nav, footer) and include `{@render children()}` to render page content. Example:

```svelte
<script>
    import { LayoutProps } from './$types';
    let { children, data } = $props();
</script>

<p>Some Content that is shared for all pages below this layout</p>
<!-- child layouts/page goes here -->
{@render children()}
```

- Create subdirectory `+layout.svelte` to scope UI to nested routes, inheriting parent layouts.
- Use layouts to avoid repeating common markup; do **not** duplicate UI in every `+page.svelte`.

### +layout.js / +layout.server.js

- In `+layout.js` or `+layout.server.js` export `load()` (typed `LayoutLoad`) to supply `data` to the layout and its children; set `prerender`, `ssr`, `csr`.
- Use `+layout.server.js` (typed `LayoutServerLoad`) for server-only things like DB or env access.
- Do **not** perform server‑only operations in `+layout.js`; use the server variant.

```js
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = () => {
	return {
		sections: [
			{ slug: 'profile', title: 'Profile' },
			{ slug: 'notifications', title: 'Notifications' }
		]
	};
}
```

### +server.js (Endpoints)

- Export HTTP handlers (`GET`, `POST`, etc.) in `+server.js` under `src/routes`; receive `RequestEvent`, return `Response` or use `json()`, `error()`, `redirect()` (exported from `@sveltejs/kit`).
- export `fallback` to catch all other methods.

```js
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) => {
	return new Response('hello world');
}
```

### $types

- SvelteKit creates `$types.d.ts` with `PageProps`, `LayoutProps`, `RequestHandler`, `PageLoad`, etc., for type‑safe props and loaders.
- Use them inside `+page.svelte`/`+page.server.js`/`+page.js`/`+layout.svelte`/`+layout.server.js`/`+layout.js` by importing from `./$types`

### Other files

- Any non‑`+` files in route folders are ignored by the router, use this to your advantage to colocate utilities or components.
- For cross‑route imports, place modules under `src/lib` and import via `$lib`.

## Loading data

### Page data

- `+page.js` exports a `load` (`PageLoad`) whose returned object is available in `+page.svelte` via `let { data } = $props()` (e.g. when you do `return { foo }` from `load` it is available within `let { data } = $props()` in `+page.svelte` as `data.foo`)
- Universal loads run on SSR and CSR; private or DB‑backed loads belong in `+page.server.js` (`PageServerLoad`) and must return devalue‑serializable data.

Example:

```js
// file: src/routes/foo/+page.js
export async function load({ fetch }) {
	const result = await fetch('/data/from/somewhere').then((r) => r.json());
	return { result }; // return property "result"
}
```

```svelte
<!-- file: src/routes/foo/+page.svelte -->
<script>
  // "data" prop contains property "result"
  let { data } = $props();
</script>
{data.result}
```

### Layout data

- `+layout.js` or `+layout.server.js` exports a `load` (`LayoutLoad`/`LayoutServerLoad`)
- Layout data flows downward: child layouts and pages see parent data in their `data` prop.
- Data loading flow (interaction of load function and props) works the same as for `+page(.server).js/svelte`

### page.data

- The `page` object from `$app/state` gives access to all data from `load` functions via `page.data`, usable in any layout or page.
- Ideal for things like `<svelte:head><title>{page.data.title}</title></svelte:head>`.
- Types come from `App.PageData`
- earlier Svelte versions used `$app/stores` for the same concepts, do NOT use `$app/stores` anymore unless prompted to do so

### Universal vs. server loads

- Universal (`+*.js`) run on server first, then in browser; server (`+*.server.js`) always run server‑side and can use secrets, cookies, DB, etc.
- Both receive `params`, `route`, `url`, `fetch`, `setHeaders`, `parent`, `depends`; server loads additionally get `cookies`, `locals`, `platform`, `request`.
- Use server loads for private data or non‑serializable items; universal loads for public APIs or returning complex values (like constructors).

### Load function arguments

- `url` is a `URL` object (no `hash` server‑side); `route.id` shows the route pattern; `params` map path segments to values.
- Query parameters via `url.searchParams` trigger reruns when they change.
- Use these to branch logic and fetch appropriate data in `load`.

## Making Fetch Requests

Use the provided `fetch` function for enhanced features:

```js
// src/routes/items/[id]/+page.js
export async function load({ fetch, params }) {
	const res = await fetch(`/api/items/${params.id}`);
	const item = await res.json();
	return { item };
}
```

## Headers and Cookies

Set response headers using `setHeaders`:

```js
export async function load({ fetch, setHeaders }) {
	const response = await fetch(url);

	setHeaders({
		age: response.headers.get('age'),
		'cache-control': response.headers.get('cache-control')
	});

	return response.json();
}
```

Access cookies in server load functions using `cookies`:

```js
export async function load({ cookies }) {
	const sessionid = cookies.get('sessionid');
	return {
		user: await db.getUser(sessionid)
	};
}
```

Do not set `set-cookie` via `setHeaders`; use `cookies.set()` instead.

## Using Parent Data

Access data from parent load functions:

```js
export async function load({ parent }) {
	const { a } = await parent();
	return { b: a + 1 };
}
```

## Errors and Redirects

Redirect users using `redirect`:

```js
import { redirect } from '@sveltejs/kit';

export function load({ locals }) {
	if (!locals.user) {
		redirect(307, '/login');
	}
}
```

Throw expected errors using `error`:

```js
import { error } from '@sveltejs/kit';

export function load({ locals }) {
	if (!locals.user) {
		error(401, 'not logged in');
	}
}
```

Unexpected exceptions trigger `handleError` hook and a 500 response.

## Streaming with Promises

Server load functions can stream promises as they resolve:

```js
export async function load({ params }) {
	return {
		comments: loadComments(params.slug),
		post: await loadPost(params.slug)
	};
}
```

```svelte
<h1>{data.post.title}</h1>
<div>{@html data.post.content}</div>

{#await data.comments}
  Loading comments...
{:then comments}
  {#each comments as comment}
    <p>{comment.content}</p>
  {/each}
{:catch error}
  <p>error loading comments: {error.message}</p>
{/await}
```

## Rerunning Load Functions

Load functions rerun when:

- Referenced params or URL properties change
- A parent load function reran and `await parent()` was called
- A dependency was invalidated with `invalidate(url)` or `invalidateAll()`

Manually invalidate load functions:

```js
// In load function
export async function load({ fetch, depends }) {
	depends('app:random');
	// ...
}

// In component
import { invalidate } from '$app/navigation';
function rerunLoadFunction() {
	invalidate('app:random');
}
```

## Dependency Tracking

Exclude from dependency tracking with `untrack`:

```js
export async function load({ untrack, url }) {
	if (untrack(() => url.pathname === '/')) {
		return { message: 'Welcome!' };
	}
}
```

### Implications for authentication

- Layout loads don’t automatically rerun on CSR; guards in `+layout.server.js` require child pages to await the parent.
- To avoid missed auth checks and waterfalls, use hooks like `handle` for global protection or per‑page server loads.

### Using getRequestEvent

- `getRequestEvent()` retrieves the current server `RequestEvent`, letting shared functions (e.g. `requireLogin()`) access `locals`, `url`, etc., without parameter passing.

## Using forms

### Form actions

- A `+page.server.js` can export `export const actions: Actions = { default: async (event) => {…} }`; `<form method="POST">` in `+page.svelte` posts to the default action without any JS. `+page.js` or `+layout.js` or `+layout.server.js` can NOT export `actions`
- Name multiple actions (`login`, `register`) in `actions`, invoke with `action="?/register"` or `button formaction="?/register"`; do NOT use `default` name in this case.
- Each action gets `{ request, cookies, params }`, uses `await request.formData()`, sets cookies or DB state, and returns an object that appears on the page as `form` (typed via `PageProps`).

Example: Define a default action in `+page.server.js`:

```js
// file: src/routes/login/+page.server.js
import type { Actions } from './$types';

export const actions: Actions = {
	default: async (event) => {
		// TODO log the user in
	}
};
```

Use it with a simple form:

```svelte
<!-- file: src/routes/login/+page.svelte -->
<form method="POST">
	<label>
		Email
		<input name="email" type="email">
	</label>
	<label>
		Password
		<input name="password" type="password">
	</label>
	<button>Log in</button>
</form>
```

### Validation errors

- Return `fail(400, { field, error: true })` from an action to send back status and data; display via `form?.field` and repopulate inputs with `value={form?.field ?? ''}`.
- Use `fail` instead of throwing so the nearest `+error.svelte` isn’t invoked and the user can correct their input.
- `fail` payload must be JSON‑serializable.

### Redirects

- In an action, call `redirect(status, location)` to send a 3xx redirect; this throws and bypasses form re-render.
- Client-side, use `goto()` from `$app/navigation` for programmatic redirects.

### Loading data after actions

- After an action completes (unless redirected), SvelteKit reruns `load` functions and re‑renders the page, merging the action’s return value into `form`.
- The `handle` hook runs once before the action; if you modify cookies in your action, you must also update `event.locals` there to keep `load` in sync.
- Do NOT assume `locals` persists automatically; set `event.locals` inside your action when auth state changes.

### Progressive enhancement

- Apply `use:enhance` from `$app/forms` to `<form>` to intercept submissions, prevent full reloads, update `form`, `page.form`, `page.status`, reset the form, invalidate all data, handle redirects, render errors, and restore focus. Do NOT use onsubmit event for progressive enhancement
- To customize, provide a callback that runs before submit and returns a handler; use `update()` for default logic or `applyAction(result)` to apply form data without full invalidation.
- You can also write your own `onsubmit` listener using `fetch`, then `deserialize` the response and `applyAction`/`invalidateAll`; do NOT use `JSON.parse` for action responses.

```svelte
<script>
  import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	let { form } = $props();
</script>

<form method="POST" use:enhance>
	<!-- form content -->
</form>
```

## Page options

#### prerender

- Set `export const prerender = true|false|'auto'` in page or layout modules; `true` generates static HTML, `false` skips, `'auto'` includes in SSR manifest.
- Applies to pages **and** `+server.js` routes (inherit parent flags); dynamic routes need `entries()` or `config.kit.prerender.entries` to tell the crawler which parameter values to use.
- Do NOT prerender pages that use form actions or rely on `url.searchParams` server‑side.

#### entries

- In a dynamic route’s `+page(.server).js` or `+server.js`, export `export function entries(): Array<Record<string,string>>` (can be async) to list parameter sets for prerendering.
- Overrides default crawling to ensure dynamic pages (e.g. `/blog/[slug]`) are generated.
- Do NOT forget to pair `entries()` with `export const prerender = true`.

### ssr

- `export const ssr = false` disables server-side rendering, sending only an HTML shell and turning the page into a client-only SPA.
- Use sparingly (e.g. when using browser‑only globals); do NOT set both `ssr` and `csr` to `false` or nothing will render.

#### csr

- `export const csr = false` prevents hydration, omits JS bundle, disables `<script>`s, form enhancements, client routing, and HMR.
- Ideal for purely static pages (e.g. marketing or blog posts); do NOT disable CSR on pages requiring interactivity.

## State management

- Avoid shared server variables—servers are stateless and shared across users. Authenticate via cookies and persist to a database instead of writing to in‑memory globals.
- Keep `load` functions pure: no side‑effects or global store writes. Return data from `load` and pass it via `data` or `page.data`.
- For shared client‑only state across components, use Svelte’s context API (`setContext`/`getContext`) or URL parameters for persistent filters; snapshots for ephemeral UI state tied to navigation history.

## Building your app

- Build runs in two phases: Vite compiles and prerenders (if enabled), then an adapter tailors output for your deployment target.
- Guard any code that should not execute at build time with `import { building } from '$app/environment'; if (!building) { … }`.
- Preview your production build locally with `npm run preview` (Node‑only, no adapter hooks).

## Adapters

- Adapters transform the built app into deployable assets for various platforms (Cloudflare, Netlify, Node, static, Vercel, plus community adapters).
- Configure in `svelte.config.js` under `kit.adapter = adapter(opts)`, importing the adapter module and passing its options.
- Some adapters expose a `platform` object (e.g. Cloudflare’s `env`); access it via `event.platform` in hooks and server routes.

## Single‑page apps

- Turn your app into a fully CSR SPA by setting `export const ssr = false;` in the root `+layout.js`.
- For static hosting, use `@sveltejs/adapter-static` with a `fallback` HTML (e.g. `200.html`) so client routing can handle unknown paths.
- You can still prerender select pages by enabling `prerender = true` and `ssr = true` in their individual `+page.js` or `+layout.js` modules.

## Advanced routing

- Rest parameters (`[...file]`) capture an unknown number of segments (e.g. `src/routes/hello/[...path]` catches all routes under `/hello`) and expose them as a single string; use a catch‑all route `+error.svelte` to render nested custom 404 pages.
- Optional parameters (`[[lang]]`) make a segment optional, e.g. for `[[lang]]/home` both `/home` and `/en/home` map to the same route; cannot follow a rest parameter.
- Matchers in `src/params/type.js` let you constrain `[param=type]` (e.g. only “apple” or “orange”), falling back to other routes or a 404 if the test fails.

### Advanced layouts

- Group directories `(app)` or `(marketing)` apply a shared layout without affecting URLs.
- Break out of the inherited layout chain per page with `+page@segment.svelte` (e.g. `+page@(app).svelte`) or per layout with `+layout@.svelte`.
- Use grouping judiciously: overuse can complicate nesting; sometimes simple composition or wrapper components suffice.

## Hooks

### Server hooks

- `handle({ event, resolve })`: runs on every request; mutate `event.locals`, bypass routing, or call `resolve(event, { transformPageChunk, filterSerializedResponseHeaders, preload })` to customize HTML, headers, and asset preloading.
- `handleFetch({ event, request, fetch })`: intercepts server‑side `fetch` calls to rewrite URLs, forward cookies on cross‑origin, or route internal requests directly to handlers.
- `init()`: runs once at server startup for async setup (e.g. database connections).

### Shared hooks

- `handleError({ error, event, status, message })`: catches unexpected runtime errors on server or client; log via Sentry or similar, return a safe object (e.g. `{ message: 'Oops', errorId }`) for `$page.error`.

### Universal hooks

- `reroute({ url, fetch? })`: map incoming `url.pathname` to a different route ID (without changing the address bar), optionally async and using `fetch`.
- `transport`: define `encode`/`decode` for custom types (e.g. class instances) to serialize them across server/client boundaries in loads and actions.

## Errors

- Expected errors thrown with `error(status, message|object)` set the response code, render the nearest `+error.svelte` with `page.error`, and let you pass extra props (e.g. `{ code: 'NOT_FOUND' }`).
- Unexpected exceptions invoke the `handleError` hook, are logged internally, and expose a generic `{ message: 'Internal Error' }` to users; customize reporting or user‑safe messages in `handleError`.
- Errors in server handlers or `handle` return JSON or your `src/error.html` fallback based on `Accept` headers; errors in `load` render component boundaries as usual. Type‑safe shapes via a global `App.Error` interface.

## Link options

The following are HTML attributes you can put on any HTML element.

- `data-sveltekit-preload-data="hover"|"tap"` preloads `load` on link hover (`touchstart`) or immediate tap; use `"tap"` for fast‑changing data.
- `data-sveltekit-preload-code="eager"|"viewport"|"hover"|"tap"` preloads JS/CSS aggressively or on scroll/hover/tap to improve load times.
- `data-sveltekit-reload` forces full-page reload; `data-sveltekit-replacestate` uses `replaceState`; `data-sveltekit-keepfocus` retains focus; `data-sveltekit-noscroll` preserves scroll position; disable any by setting the value to `"false"`.

## Server-only modules

- `$env/static/private` and `$env/dynamic/private` can only be imported into server‑only files (`hooks.server.js`, `+page.server.js`); prevents leaking secrets to the client.
- `$app/server` (e.g. the `read()` API) is likewise restricted to server‑side code.
- Make your own modules server‑only by naming them `*.server.js` or placing them in `src/lib/server/`; any public‑facing import chain to these files triggers a build error.

## Shallow routing

- Use `pushState(path, state)` or `replaceState('', state)` from `$app/navigation` to create history entries without full navigation; read/write `page.state` from `$app/state`.
- Ideal for UI like modals: `if (page.state.showModal) <Modal/>` and dismiss with `history.back()`.
- To embed a route’s page component without navigation, preload data with `preloadData(href)` then `pushState`, falling back to `goto`; note SSR and initial load have empty `page.state`, and shallow routing requires JS.

## Images

- Vite’s asset handling inlines small files, adds hashes, and lets you `import logo from '...png'` for use in `<img src={logo}>`.
- Install `@sveltejs/enhanced-img` and add `enhancedImages()` to your Vite config; use `<enhanced:img src="...jpg" alt="…"/>` to auto‑generate `<picture>` tags with AVIF/WebP, responsive `srcset`/`sizes`, and intrinsic dimensions.
- For CMS or dynamic images, leverage a CDN with Svelte libraries like `@unpic/svelte`; always supply high‑resolution originals (2×), specify `sizes` for LCP images, set `fetchpriority="high"`, constrain layout via CSS to avoid CLS, and include meaningful `alt` text.

## Reference docs

### Imports from `@sveltejs/kit`

- **error**: throw an HTTP error and halt request processing

  ```js
  import { error } from '@sveltejs/kit';
  export function load() {
  	error(404, 'Not found');
  }
  ```

- **fail**: return a form action failure without throwing

  ```js
  import { fail } from '@sveltejs/kit';
  export const actions = {
  	default: async ({ request }) => {
  		const data = await request.formData();
  		if (!data.get('name')) return fail(400, { missing: true });
  	}
  };
  ```

- **isActionFailure**: type‑guard for failures from `fail`

  ```js
  import { isActionFailure } from '@sveltejs/kit';
  if (isActionFailure(result)) {
  	/* handle invalid form */
  }
  ```

- **isHttpError**: type‑guard for errors from `error`

  ```js
  import { isHttpError } from '@sveltejs/kit';
  try {
  	/* … */
  } catch (e) {
  	if (isHttpError(e, 404)) console.log('Not found');
  }
  ```

- **isRedirect**: type‑guard for redirects from `redirect`

  ```js
  import { redirect, isRedirect } from '@sveltejs/kit';
  try {
  	redirect(302, '/login');
  } catch (e) {
  	if (isRedirect(e)) console.log('Redirecting');
  }
  ```

- **json**: build a JSON `Response`

  ```js
  import { json } from '@sveltejs/kit';
  export function GET() {
  	return json({ hello: 'world' });
  }
  ```

- **normalizeUrl** _(v2.18+)_: strip internal suffixes/trailing slashes

  ```js
  import { normalizeUrl } from '@sveltejs/kit';
  const { url, denormalize } = normalizeUrl('/foo/__data.json');
  url.pathname; // /foo
  ```

- **redirect**: throw a redirect response

  ```js
  import { redirect } from '@sveltejs/kit';
  export function load() {
  	redirect(303, '/dashboard');
  }
  ```

- **text**: build a plain‑text `Response`

  ```js
  import { text } from '@sveltejs/kit';
  export function GET() {
  	return text('Hello, text!');
  }
  ```

### Imports from `@sveltejs/kit/hooks`

- **sequence**: compose multiple `handle` hooks into one, merging their options

  ```js
  import { sequence } from '@sveltejs/kit/hooks';
  export const handle = sequence(handleOne, handleTwo);
  ```

### Imports from `$app/forms`

- **applyAction**: apply an `ActionResult` to update `page.form` and `page.status`

  ```js
  import { applyAction } from '$app/forms';
  // inside enhance callback:
  await applyAction(result);
  ```

- **deserialize**: parse a serialized form action response back into `ActionResult`

  ```js
  import { deserialize } from '$app/forms';
  const result = deserialize(await response.text());
  ```

- **enhance**: progressively enhance a `<form>` for AJAX submissions

  ```svelte
  <script>
    import { enhance } from '$app/forms';
  </script>
  <form use:enhance on:submit={handle}>
  ```

### Imports from `$app/navigation`

- **afterNavigate**: run code after every client‑side navigation. Needs to be called at component initialization

  ```js
  import { afterNavigate } from '$app/navigation';
  afterNavigate(({ type, to }) => console.log('navigated via', type));
  ```

- **beforeNavigate**: intercept and optionally cancel upcoming navigations. Needs to be called at component initialization

  ```js
  import { beforeNavigate } from '$app/navigation';
  beforeNavigate(({ cancel }) => {
  	if (!confirm('Leave?')) cancel();
  });
  ```

- **disableScrollHandling**: disable automatic scroll resetting after navigation

  ```js
  import { disableScrollHandling } from '$app/navigation';
  disableScrollHandling();
  ```

- **goto**: programmatically navigate within the app

  ```svelte
  <script>
    import { goto } from '$app/navigation';
    function navigate() {
      goto('/dashboard', { replaceState: true });
    }
  </script>
    <button onclick={navigate}>navigate</button>
  ```

- **invalidate**: re‑run `load` functions that depend on a given URL or custom key

  ```js
  import { invalidate } from '$app/navigation';
  await invalidate('/api/posts');
  ```

- **invalidateAll**: re‑run every `load` for the current page

  ```js
  import { invalidateAll } from '$app/navigation';
  await invalidateAll();
  ```

- **onNavigate**: hook invoked immediately before client‑side navigations. Needs to be called at component initialization

  ```js
  import { onNavigate } from '$app/navigation';
  onNavigate(({ to }) => console.log('about to go to', to.url));
  ```

- **preloadCode**: import route modules ahead of navigation (no data fetch)

  ```js
  import { preloadCode } from '$app/navigation';
  await preloadCode('/about');
  ```

- **preloadData**: load both code and data for a route ahead of navigation

  ```js
  import { preloadData } from '$app/navigation';
  const result = await preloadData('/posts/1');
  ```

- **pushState**: create a shallow‑routing history entry with custom state

  ```js
  import { pushState } from '$app/navigation';
  pushState('', { modalOpen: true });
  ```

- **replaceState**: replace the current history entry with new custom state

  ```js
  import { replaceState } from '$app/navigation';
  replaceState('', { modalOpen: false });
  ```

### Imports from `$app/paths`

- **assets**: the absolute URL prefix for static assets (`config.kit.paths.assets`)

  ```js
  import { assets } from '$app/paths';
  console.log(`<img src="${assets}/logo.png">`);
  ```

- **base**: the base path for your app (`config.kit.paths.base`)

  ```svelte
  <a href="{base}/about">About Us</a>
  ```

- **resolveRoute**: interpolate a route ID with parameters to form a pathname

  ```js
  import { resolveRoute } from '$app/paths';
  resolveRoute('/blog/[slug]/[...rest]', {
  	slug: 'hello',
  	rest: '2024/updates'
  });
  // → "/blog/hello/2024/updates"
  ```

### Imports from `$app/server`

- **getRequestEvent** _(v2.20+)_: retrieve the current server `RequestEvent`

  ```js
  import { getRequestEvent } from '$app/server';
  export function load() {
  	const event = getRequestEvent();
  	console.log(event.url);
  }
  ```

- **read** _(v2.4+)_: read a static asset imported by Vite as a `Response`

  ```js
  import { read } from '$app/server';
  import fileUrl from './data.txt';
  const res = read(fileUrl);
  console.log(await res.text());
  ```

- **navigating**: a read‑only object describing any in‑flight navigation (or `null`)

  ```svelte
  <script>
    import { navigating } from '$app/state';
    console.log(navigating.from, navigating.to);
  </script>
  ```

### Imports from `$app/state`

- **page**: read‑only reactive info about the current page (`url`, `params`, `data`, etc.)

  ```svelte
  <script>
    import { page } from '$app/state';
    const path = $derived(page.url.pathname);
  </script>
  {path}
  ```

- **updated**: reactive flag for new app versions; call `updated.check()` to poll immediately

  ```svelte
  <script>
    import { updated } from '$app/state';
    $effect(() => {
      if (updated.current) {
        alert('A new version is available. Refresh?');
      }
    })
  </script>
  ```

### Imports from `$env/dynamic/private`

- **env (dynamic/private)**: runtime private env vars (`process.env…`), not exposed to client

  ```js
  import { env } from '$env/dynamic/private';
  console.log(env.SECRET_API_KEY);
  ```

### Imports from `$env/dynamic/public`

- **env (dynamic/public)**: runtime public env vars (`PUBLIC_…`), safe for client use

  ```js
  import { env } from '$env/dynamic/public';
  console.log(env.PUBLIC_BASE_URL);
  ```

### Imports from `$env/static/private`

- **$env/static/private**: compile‑time private env vars, dead‑code eliminated

  ```js
  import { DATABASE_URL } from '$env/static/private';
  console.log(DATABASE_URL);
  ```

### Imports from `$env/static/public`

- **$env/static/public**: compile‑time public env vars (`PUBLIC_…`), safe on client

  ```js
  import { PUBLIC_WS_ENDPOINT } from '$env/static/public';
  console.log(PUBLIC_WS_ENDPOINT);
  ```

### `$lib` alias

Alias for `src/lib` folder, e.g.

```svelte
<script>
  import Button from '$lib/Button.svelte';
</script>
<Button>Click me</Button>
```

means that there's a component at `src/lib/Button.svelte`.


# Bun Documentation

> Bun is a fast all-in-one JavaScript runtime & toolkit designed for speed, complete with a bundler, test runner, and Node.js-compatible package manager.

This documentation covers all aspects of using Bun, from installation to advanced usage.

## Recent Bun Versions

- [Bun v1.2.11](https://bun.sh/blog/bun-v1.2.11.md): `process.ref` and `process.unref`, `util.parseArgs` negative options, `BUN_INSPECT_PRELOAD`, Highway SIMD, Node.js compatibility improvements for `node:http`, `node:https`, `node:tls`, and `node:readline`
- [Bun v1.2.10](https://bun.sh/blog/bun-v1.2.10.md): setImmediate gets faster. Reliability improvements for filesystem operations. Fixes test.failing with done callbacks. Fixes default idle timeout in Redis client. Fixes importing from 'bun' module with bytecode compilation. Default Docker image updated to Debian Bookworm.
- [Bun v1.2.9](https://bun.sh/blog/bun-v1.2.9.md): Bun.redis is a builtin Redis client for Bun. `ListObjectsV2` support in `Bun.S3Client`, more `libuv` symbols, `require.extensions` & require.resolve paths, bugfixes in `node:http`, `AsyncLocalStorage`, and `node:crypto`. Shell reliability improvements.
- [Bun v1.2.8](https://bun.sh/blog/bun-v1.2.8.md): napi improvements make node-sdl 100x faster. Headers.get() is 2x faster. Several node:http bugfixes. node:fs improvements. `bun install --frozen-lockfile` now works with `overrides`. `bun pack` now handles directory-specific pattern exclusion.
- [Bun v1.2.7](https://bun.sh/blog/bun-v1.2.7.md): Bun.CookieMap is a Map-like API for getting & setting cookies. Bun's TypeScript type declarations have been rewritten to eliminate conflicts with Node.js and DOM type definitions. Several bugfixes for node:http, node:crypto, and node:vm.

## Documentation Sections


### Intro

- [What is Bun?](https://bun.sh/docs/index.md): Bun is an all-in-one runtime for JavaScript and TypeScript apps. Build, run, and test apps with one fast tool.
- [Installation](https://bun.sh/docs/installation.md): Install Bun with npm, Homebrew, Docker, or the official install script.
- [Quickstart](https://bun.sh/docs/quickstart.md): Get started with Bun by building and running a simple HTTP server in 6 lines of TypeScript.
- [TypeScript](https://bun.sh/docs/typescript.md): Install and configure type declarations for Bun's APIs

### Templating

- [`bun init`](https://bun.sh/docs/cli/init.md): Scaffold an empty Bun project.
- [`bun create`](https://bun.sh/docs/cli/bun-create.md): Scaffold a new Bun project from an official template or GitHub repo.

### Runtime

- [`bun run`](https://bun.sh/docs/cli/run.md): Use `bun run` to execute JavaScript/TypeScript files and package.json scripts.
- [File types](https://bun.sh/docs/runtime/loaders.md): Bun's runtime supports JavaScript/TypeScript files, JSX syntax, Wasm, JSON/TOML imports, and more.
- [TypeScript](https://bun.sh/docs/runtime/typescript.md): Bun can directly execute TypeScript files without additional configuration.
- [JSX](https://bun.sh/docs/runtime/jsx.md): Bun can directly execute TypeScript files without additional configuration.
- [Environment variables](https://bun.sh/docs/runtime/env.md): How to read and set environment variables, plus how to use them to configure Bun
- [Bun APIs](https://bun.sh/docs/runtime/bun-apis.md): Bun provides a set of highly optimized native APIs for performing common tasks.
- [Web APIs](https://bun.sh/docs/runtime/web-apis.md): Bun implements an array of Web-standard APIs like fetch, URL, and WebSocket.
- [Node.js compatibility](https://bun.sh/docs/runtime/nodejs-apis.md): Bun aims for full Node.js compatibility. This page tracks the current compatibility status.
- [Single-file executable](https://bun.sh/docs/bundler/executables.md): Compile a TypeScript or JavaScript file to a standalone executable
- [Plugins](https://bun.sh/docs/runtime/plugins.md): Implement custom loaders and module resolution logic with Bun's plugin system.
- [Watch mode](https://bun.sh/docs/runtime/hot.md): Reload your application & tests automatically.
- [Module resolution](https://bun.sh/docs/runtime/modules.md): Bun uses ESM and implements an extended version of the Node.js module resolution algorithm.
- [Auto-install](https://bun.sh/docs/runtime/autoimport.md): Never use node_modules again. Bun can optionally auto-install your dependencies on the fly.
- [bunfig.toml](https://bun.sh/docs/runtime/bunfig.md): Bun's runtime is configurable with environment variables and the bunfig.toml config file.
- [Debugger](https://bun.sh/docs/runtime/debugger.md): Debug your code with Bun's web-based debugger or VS Code extension

### Package manager

- [`bun install`](https://bun.sh/docs/cli/install.md): Install all dependencies with `bun install`, or manage dependencies with `bun add` and `bun remove`.
- [`bun add`](https://bun.sh/docs/cli/add.md): Add dependencies to your project.
- [`bun remove`](https://bun.sh/docs/cli/remove.md): Remove dependencies from your project.
- [`bun update`](https://bun.sh/docs/cli/update.md): Update your project's dependencies.
- [`bun publish`](https://bun.sh/docs/cli/publish.md): Publish your package to an npm registry.
- [`bun outdated`](https://bun.sh/docs/cli/outdated.md): Check for outdated dependencies.
- [`bun link`](https://bun.sh/docs/cli/link.md): Install local packages as dependencies in your project.
- [`bun pm`](https://bun.sh/docs/cli/pm.md): Utilities relating to package management with Bun.
- [Global cache](https://bun.sh/docs/install/cache.md): Bun's package manager installs all packages into a shared global cache to avoid redundant re-downloads.
- [Workspaces](https://bun.sh/docs/install/workspaces.md): Bun's package manager supports workspaces and monorepo development workflows.
- [Lifecycle scripts](https://bun.sh/docs/install/lifecycle.md): How Bun handles package lifecycle scripts with trustedDependencies
- [Filter](https://bun.sh/docs/cli/filter.md): Run scripts in multiple packages in parallel
- [Lockfile](https://bun.sh/docs/install/lockfile.md): Bun's lockfile `bun.lock` tracks your resolved dependency tree, making future installs fast and repeatable.
- [Scopes and registries](https://bun.sh/docs/install/registries.md): How to configure private scopes, custom package registries, authenticating with npm token, and more.
- [Overrides and resolutions](https://bun.sh/docs/install/overrides.md): Specify version ranges for nested dependencies
- [Patch dependencies](https://bun.sh/docs/install/patch.md): Patch dependencies in your project to fix bugs or add features without vendoring the entire package.
- [.npmrc support](https://bun.sh/docs/install/npmrc.md): Bun supports loading some configuration options from .npmrc

### Bundler

- [`Bun.build`](https://bun.sh/docs/bundler): Bundle code for consumption in the browser with Bun's native bundler.
- [HTML & static sites](https://bun.sh/docs/bundler/html.md): Zero-config HTML bundler for single-page apps and multi-page apps. Automatic bundling, TailwindCSS plugins, TypeScript, JSX, React support, and incredibly fast builds
- [CSS](https://bun.sh/docs/bundler/css.md): Production ready CSS bundler with support for modern CSS features, CSS modules, and more.
- [Fullstack Dev Server](https://bun.sh/docs/bundler/fullstack.md): Serve your frontend and backend from the same app with Bun's dev server.
- [Hot reloading](https://bun.sh/docs/bundler/hmr.md): Update modules in a running application without reloading the page using import.meta.hot
- [Loaders](https://bun.sh/docs/bundler/loaders.md): Bun's built-in loaders for the bundler and runtime
- [Plugins](https://bun.sh/docs/bundler/plugins.md): Implement custom loaders and module resolution logic with Bun's plugin system.
- [Macros](https://bun.sh/docs/bundler/macros.md): Run JavaScript functions at bundle-time and inline the results into your bundle
- [vs esbuild](https://bun.sh/docs/bundler/vs-esbuild.md): Guides for migrating from other bundlers to Bun.

### Test runner

- [`bun test`](https://bun.sh/docs/cli/test.md): Bun's test runner uses Jest-compatible syntax but runs 100x faster.
- [Writing tests](https://bun.sh/docs/test/writing.md): Write your tests using Jest-like expect matchers, plus setup/teardown hooks, snapshot testing, and more
- [Watch mode](https://bun.sh/docs/test/hot.md): Reload your tests automatically on change.
- [Lifecycle hooks](https://bun.sh/docs/test/lifecycle.md): Add lifecycle hooks to your tests that run before/after each test or test run
- [Mocks](https://bun.sh/docs/test/mocks.md): Mocks functions and track method calls
- [Snapshots](https://bun.sh/docs/test/snapshots.md): Add lifecycle hooks to your tests that run before/after each test or test run
- [Dates and times](https://bun.sh/docs/test/time.md): Control the date & time in your tests for more reliable and deterministic tests
- [Code coverage](https://bun.sh/docs/test/coverage.md): Generate code coverage reports with `bun test --coverage`
- [Test reporters](https://bun.sh/docs/test/reporters.md): Add a junit reporter to your test runs
- [Test configuration](https://bun.sh/docs/test/configuration.md): Configure the test runner with bunfig.toml
- [Runtime behavior](https://bun.sh/docs/test/runtime-behavior.md): Learn how the test runner affects Bun's runtime behavior
- [Finding tests](https://bun.sh/docs/test/discovery.md): Learn how the test runner discovers tests
- [DOM testing](https://bun.sh/docs/test/dom.md): Write headless tests for UI and React/Vue/Svelte/Lit components with happy-dom

### Package runner

- [`bunx`](https://bun.sh/docs/cli/bunx.md): Use `bunx` to auto-install and run executable packages from npm.

### API

- [HTTP server](https://bun.sh/docs/api/http.md): Bun implements a fast HTTP server built on Request/Response objects, along with supporting node:http APIs.
- [HTTP client](https://bun.sh/docs/api/fetch.md): Bun implements Web-standard fetch with some Bun-native extensions.
- [WebSockets](https://bun.sh/docs/api/websockets.md): Bun supports server-side WebSockets with on-the-fly compression, TLS support, and a Bun-native pubsub API.
- [Workers](https://bun.sh/docs/api/workers.md): Run code in a separate thread with Bun's native Worker API.
- [Binary data](https://bun.sh/docs/api/binary-data.md): How to represent and manipulate binary data in Bun.
- [Streams](https://bun.sh/docs/api/streams.md): Reading, writing, and manipulating streams of data in Bun.
- [SQL](https://bun.sh/docs/api/sql.md): Bun provides fast, native bindings for interacting with PostgreSQL databases.
- [S3 Object Storage](https://bun.sh/docs/api/s3.md): Bun provides fast, native bindings for interacting with S3-compatible object storage services.
- [File I/O](https://bun.sh/docs/api/file-io.md): Read and write files fast with Bun's heavily optimized file system API.
- [Redis client](https://bun.sh/docs/api/redis.md): Bun provides a fast, native Redis client with automatic command pipelining for better performance.
- [import.meta](https://bun.sh/docs/api/import-meta.md): Module-scoped metadata and utilities
- [SQLite](https://bun.sh/docs/api/sqlite.md): The fastest SQLite driver for JavaScript is baked directly into Bun.
- [FileSystemRouter](https://bun.sh/docs/api/file-system-router.md): Resolve incoming HTTP requests against a local file system directory with Bun's fast, Next.js-compatible router.
- [TCP sockets](https://bun.sh/docs/api/tcp.md): Bun's native API implements Web-standard TCP Sockets, plus a Bun-native API for building fast TCP servers.
- [UDP sockets](https://bun.sh/docs/api/udp.md): Bun's native API implements fast and flexible UDP sockets.
- [Globals](https://bun.sh/docs/api/globals.md): Bun implements a range of Web APIs, Node.js APIs, and Bun-native APIs that are available in the global scope.
- [$ Shell](https://bun.sh/docs/runtime/shell.md): Bun's cross-platform shell-scripting API makes shell scripting with JavaScript fun
- [Child processes](https://bun.sh/docs/api/spawn.md): Spawn sync and async child processes with easily configurable input and output streams.
- [HTMLRewriter](https://bun.sh/docs/api/html-rewriter.md): Parse and transform HTML with Bun's native HTMLRewriter API, inspired by Cloudflare Workers.
- [Hashing](https://bun.sh/docs/api/hashing.md): Native support for a range of fast hashing algorithms.
- [Console](https://bun.sh/docs/api/console.md): Bun implements a Node.js-compatible `console` object with colorized output and deep pretty-printing.
- [Cookie](https://bun.sh/docs/api/cookie.md): Bun's native Cookie API simplifies working with HTTP cookies.
- [FFI](https://bun.sh/docs/api/ffi.md): Call native code from JavaScript with Bun's foreign function interface (FFI) API.
- [C Compiler](https://bun.sh/docs/api/cc.md): Build & run native C from JavaScript with Bun's native C compiler API
- [Testing](https://bun.sh/docs/api/test.md): Bun's built-in test runner is fast and uses Jest-compatible syntax.
- [Utils](https://bun.sh/docs/api/utils.md): Bun implements a set of utilities that are commonly required by developers.
- [Node-API](https://bun.sh/docs/api/node-api.md): Bun implements the Node-API spec for building native addons.
- [Glob](https://bun.sh/docs/api/glob.md): Bun includes a fast native Glob implementation for matching file paths.
- [DNS](https://bun.sh/docs/api/dns.md): Resolve domain names to IP addresses.
- [Semver](https://bun.sh/docs/api/semver.md): Bun's native Semver implementation is 20x faster than the popular `node-semver` package.
- [Color](https://bun.sh/docs/api/color.md): Bun's color function leverages Bun's CSS parser for parsing, normalizing, and converting colors from user input to a variety of output formats.
- [Transpiler](https://bun.sh/docs/api/transpiler.md): Bun exposes its internal transpiler as a pluggable API.

### Project

- [Roadmap](https://bun.sh/docs/project/roadmap.md): Track Bun's near-term and long-term goals.
- [Benchmarking](https://bun.sh/docs/project/benchmarking.md): Bun is designed for performance. Learn how to benchmark Bun yourself.
- [Contributing](https://bun.sh/docs/project/contributing.md): Learn how to contribute to Bun and get your local development environment up and running.
- [Building Windows](https://bun.sh/docs/project/building-windows.md): Learn how to setup a development environment for contributing to the Windows build of Bun.
- [Bindgen](https://bun.sh/docs/project/bindgen.md): About the bindgen code generator
- [License](https://bun.sh/docs/project/licensing.md): Bun is a MIT-licensed project with a large number of statically-linked dependencies with various licenses.

## Guides

### Guides: Ecosystem

- [Add Sentry to a Bun app](https://bun.sh/guides/ecosystem/sentry.md)
- [Build a frontend using Vite and Bun](https://bun.sh/guides/ecosystem/vite.md)
- [Build an app with Astro and Bun](https://bun.sh/guides/ecosystem/astro.md)
- [Build an app with Next.js and Bun](https://bun.sh/guides/ecosystem/nextjs.md)
- [Build an app with Nuxt and Bun](https://bun.sh/guides/ecosystem/nuxt.md)
- [Build an app with Qwik and Bun](https://bun.sh/guides/ecosystem/qwik.md)
- [Build an app with Remix and Bun](https://bun.sh/guides/ecosystem/remix.md)
- [Build an app with SolidStart and Bun](https://bun.sh/guides/ecosystem/solidstart.md)
- [Build an app with SvelteKit and Bun](https://bun.sh/guides/ecosystem/sveltekit.md)
- [Build an HTTP server using Elysia and Bun](https://bun.sh/guides/ecosystem/elysia.md)
- [Build an HTTP server using Express and Bun](https://bun.sh/guides/ecosystem/express.md)
- [Build an HTTP server using Hono and Bun](https://bun.sh/guides/ecosystem/hono.md)
- [Build an HTTP server using StricJS and Bun](https://bun.sh/guides/ecosystem/stric.md)
- [Containerize a Bun application with Docker](https://bun.sh/guides/ecosystem/docker.md)
- [Create a Discord bot](https://bun.sh/guides/ecosystem/discordjs.md)
- [Deploy a Bun application on Render](https://bun.sh/guides/ecosystem/render.md)
- [Read and write data to MongoDB using Mongoose and Bun](https://bun.sh/guides/ecosystem/mongoose.md)
- [Run Bun as a daemon with PM2](https://bun.sh/guides/ecosystem/pm2.md)
- [Run Bun as a daemon with systemd](https://bun.sh/guides/ecosystem/systemd.md)
- [Server-side render (SSR) a React component](https://bun.sh/guides/ecosystem/ssr-react.md)
- [Use Drizzle ORM with Bun](https://bun.sh/guides/ecosystem/drizzle.md)
- [Use EdgeDB with Bun](https://bun.sh/guides/ecosystem/edgedb.md)
- [Use Neon Postgres through Drizzle ORM](https://bun.sh/guides/ecosystem/neon-drizzle.md)
- [Use Neon's Serverless Postgres with Bun](https://bun.sh/guides/ecosystem/neon-serverless-postgres.md)
- [Use Prisma with Bun](https://bun.sh/guides/ecosystem/prisma.md)
- [Use React and JSX](https://bun.sh/guides/ecosystem/react.md)

### Guides: WebSocket

- [Build a publish-subscribe WebSocket server](https://bun.sh/guides/websocket/pubsub.md)
- [Build a simple WebSocket server](https://bun.sh/guides/websocket/simple.md)
- [Enable compression for WebSocket messages](https://bun.sh/guides/websocket/compression.md)
- [Set per-socket contextual data on a WebSocket](https://bun.sh/guides/websocket/context.md)

### Guides: Package manager

- [Add a dependency](https://bun.sh/guides/install/add.md)
- [Add a development dependency](https://bun.sh/guides/install/add-dev.md)
- [Add a Git dependency](https://bun.sh/guides/install/add-git.md)
- [Add a peer dependency](https://bun.sh/guides/install/add-peer.md)
- [Add a tarball dependency](https://bun.sh/guides/install/add-tarball.md)
- [Add a trusted dependency](https://bun.sh/guides/install/trusted.md)
- [Add an optional dependency](https://bun.sh/guides/install/add-optional.md)
- [Configure a private registry for an organization scope with bun install](https://bun.sh/guides/install/registry-scope.md)
- [Configure git to diff Bun's lockb lockfile](https://bun.sh/guides/install/git-diff-bun-lockfile.md)
- [Configuring a monorepo using workspaces](https://bun.sh/guides/install/workspaces.md)
- [Generate a yarn-compatible lockfile](https://bun.sh/guides/install/yarnlock.md)
- [Install a package under a different name](https://bun.sh/guides/install/npm-alias.md)
- [Install dependencies with Bun in GitHub Actions](https://bun.sh/guides/install/cicd.md)
- [Migrate from npm install to bun install](https://bun.sh/guides/install/from-npm-install-to-bun-install.md)
- [Override the default npm registry for bun install](https://bun.sh/guides/install/custom-registry.md)
- [Using bun install with an Azure Artifacts npm registry](https://bun.sh/guides/install/azure-artifacts.md)
- [Using bun install with Artifactory](https://bun.sh/guides/install/jfrog-artifactory.md)

### Guides: Test runner

- [Bail early with the Bun test runner](https://bun.sh/guides/test/bail.md)
- [Generate code coverage reports with the Bun test runner](https://bun.sh/guides/test/coverage.md)
- [import, require, and test Svelte components with bun test](https://bun.sh/guides/test/svelte-test.md)
- [Mark a test as a "todo" with the Bun test runner](https://bun.sh/guides/test/todo-tests.md)
- [Migrate from Jest to Bun's test runner](https://bun.sh/guides/test/migrate-from-jest.md)
- [Mock functions in `bun test`](https://bun.sh/guides/test/mock-functions.md)
- [Re-run tests multiple times with the Bun test runner](https://bun.sh/guides/test/rerun-each.md)
- [Run tests in watch mode with Bun](https://bun.sh/guides/test/watch-mode.md)
- [Run your tests with the Bun test runner](https://bun.sh/guides/test/run-tests.md)
- [Set a code coverage threshold with the Bun test runner](https://bun.sh/guides/test/coverage-threshold.md)
- [Set a per-test timeout with the Bun test runner](https://bun.sh/guides/test/timeout.md)
- [Set the system time in Bun's test runner](https://bun.sh/guides/test/mock-clock.md)
- [Skip tests with the Bun test runner](https://bun.sh/guides/test/skip-tests.md)
- [Spy on methods in `bun test`](https://bun.sh/guides/test/spy-on.md)
- [Update snapshots in `bun test`](https://bun.sh/guides/test/update-snapshots.md)
- [Use snapshot testing in `bun test`](https://bun.sh/guides/test/snapshot.md)
- [Using Testing Library with Bun](https://bun.sh/guides/test/testing-library.md)
- [Write browser DOM tests with Bun and happy-dom](https://bun.sh/guides/test/happy-dom.md)

### Guides: Utilities

- [Check if the current file is the entrypoint](https://bun.sh/guides/util/entrypoint.md)
- [Check if two objects are deeply equal](https://bun.sh/guides/util/deep-equals.md)
- [Compress and decompress data with DEFLATE](https://bun.sh/guides/util/deflate.md)
- [Compress and decompress data with gzip](https://bun.sh/guides/util/gzip.md)
- [Convert a file URL to an absolute path](https://bun.sh/guides/util/file-url-to-path.md)
- [Convert an absolute path to a file URL](https://bun.sh/guides/util/path-to-file-url.md)
- [Detect when code is executed with Bun](https://bun.sh/guides/util/detect-bun.md)
- [Encode and decode base64 strings](https://bun.sh/guides/util/base64.md)
- [Escape an HTML string](https://bun.sh/guides/util/escape-html.md)
- [Get the absolute path of the current file](https://bun.sh/guides/util/import-meta-path.md)
- [Get the absolute path to the current entrypoint](https://bun.sh/guides/util/main.md)
- [Get the current Bun version](https://bun.sh/guides/util/version.md)
- [Get the directory of the current file](https://bun.sh/guides/util/import-meta-dir.md)
- [Get the file name of the current file](https://bun.sh/guides/util/import-meta-file.md)
- [Get the path to an executable bin file](https://bun.sh/guides/util/which-path-to-executable-bin.md)
- [Hash a password](https://bun.sh/guides/util/hash-a-password.md)
- [Sleep for a fixed number of milliseconds](https://bun.sh/guides/util/sleep.md)

### Guides: Reading files

- [Check if a file exists](https://bun.sh/guides/read-file/exists.md)
- [Get the MIME type of a file](https://bun.sh/guides/read-file/mime.md)
- [Read a file as a ReadableStream](https://bun.sh/guides/read-file/stream.md)
- [Read a file as a string](https://bun.sh/guides/read-file/string.md)
- [Read a file to a Buffer](https://bun.sh/guides/read-file/buffer.md)
- [Read a file to a Uint8Array](https://bun.sh/guides/read-file/uint8array.md)
- [Read a file to an ArrayBuffer](https://bun.sh/guides/read-file/arraybuffer.md)
- [Read a JSON file](https://bun.sh/guides/read-file/json.md)
- [Watch a directory for changes](https://bun.sh/guides/read-file/watch.md)

### Guides: HTMLRewriter

- [Extract links from a webpage using HTMLRewriter](https://bun.sh/guides/html-rewriter/extract-links.md)
- [Extract social share images and Open Graph tags](https://bun.sh/guides/html-rewriter/extract-social-meta.md)

### Guides: Streams

- [Convert a Node.js Readable to a Blob](https://bun.sh/guides/streams/node-readable-to-blob.md)
- [Convert a Node.js Readable to a string](https://bun.sh/guides/streams/node-readable-to-string.md)
- [Convert a Node.js Readable to an ArrayBuffer](https://bun.sh/guides/streams/node-readable-to-arraybuffer.md)
- [Convert a Node.js Readable to an Uint8Array](https://bun.sh/guides/streams/node-readable-to-uint8array.md)
- [Convert a Node.js Readable to JSON](https://bun.sh/guides/streams/node-readable-to-json.md)
- [Convert a ReadableStream to a Blob](https://bun.sh/guides/streams/to-blob.md)
- [Convert a ReadableStream to a Buffer](https://bun.sh/guides/streams/to-buffer.md)
- [Convert a ReadableStream to a string](https://bun.sh/guides/streams/to-string.md)
- [Convert a ReadableStream to a Uint8Array](https://bun.sh/guides/streams/to-typedarray.md)
- [Convert a ReadableStream to an array of chunks](https://bun.sh/guides/streams/to-array.md)
- [Convert a ReadableStream to an ArrayBuffer](https://bun.sh/guides/streams/to-arraybuffer.md)
- [Convert a ReadableStream to JSON](https://bun.sh/guides/streams/to-json.md)

### Guides: Runtime

- [Codesign a single-file JavaScript executable on macOS](https://bun.sh/guides/runtime/codesign-macos-executable.md): Fix the "can't be opened because it is from an unidentified developer" Gatekeeper warning when running your JavaScript executable.
- [Debugging Bun with the VS Code extension](https://bun.sh/guides/runtime/vscode-debugger.md)
- [Debugging Bun with the web debugger](https://bun.sh/guides/runtime/web-debugger.md)
- [Define and replace static globals & constants](https://bun.sh/guides/runtime/define-constant.md)
- [Delete directories](https://bun.sh/guides/runtime/delete-directory.md)
- [Delete files](https://bun.sh/guides/runtime/delete-file.md)
- [Import a HTML file as text](https://bun.sh/guides/runtime/import-html.md)
- [Import a JSON file](https://bun.sh/guides/runtime/import-json.md)
- [Import a TOML file](https://bun.sh/guides/runtime/import-toml.md)
- [Inspect memory usage using V8 heap snapshots](https://bun.sh/guides/runtime/heap-snapshot.md)
- [Install and run Bun in GitHub Actions](https://bun.sh/guides/runtime/cicd.md)
- [Install TypeScript declarations for Bun](https://bun.sh/guides/runtime/typescript.md)
- [Re-map import paths](https://bun.sh/guides/runtime/tsconfig-paths.md)
- [Read environment variables](https://bun.sh/guides/runtime/read-env.md)
- [Run a Shell Command](https://bun.sh/guides/runtime/shell.md)
- [Set a time zone in Bun](https://bun.sh/guides/runtime/timezone.md)
- [Set environment variables](https://bun.sh/guides/runtime/set-env.md)

### Guides: Writing files

- [Append content to a file](https://bun.sh/guides/write-file/append.md)
- [Copy a file to another location](https://bun.sh/guides/write-file/file-cp.md)
- [Delete a file](https://bun.sh/guides/write-file/unlink.md)
- [Write a Blob to a file](https://bun.sh/guides/write-file/blob.md)
- [Write a file incrementally](https://bun.sh/guides/write-file/filesink.md)
- [Write a file to stdout](https://bun.sh/guides/write-file/cat.md)
- [Write a ReadableStream to a file](https://bun.sh/guides/write-file/stream.md)
- [Write a Response to a file](https://bun.sh/guides/write-file/response.md)
- [Write a string to a file](https://bun.sh/guides/write-file/basic.md)
- [Write to stdout](https://bun.sh/guides/write-file/stdout.md)

### Guides: HTTP

- [Common HTTP server usage](https://bun.sh/guides/http/server.md)
- [Configure TLS on an HTTP server](https://bun.sh/guides/http/tls.md)
- [fetch with unix domain sockets in Bun](https://bun.sh/guides/http/fetch-unix.md)
- [Hot reload an HTTP server](https://bun.sh/guides/http/hot.md)
- [Proxy HTTP requests using fetch()](https://bun.sh/guides/http/proxy.md)
- [Send an HTTP request using fetch](https://bun.sh/guides/http/fetch.md)
- [Start a cluster of HTTP servers](https://bun.sh/guides/http/cluster.md): Run multiple HTTP servers concurrently via the "reusePort" option to share the same port across multiple processes
- [Stream a file as an HTTP Response](https://bun.sh/guides/http/stream-file.md)
- [Streaming HTTP Server with Async Iterators](https://bun.sh/guides/http/stream-iterator.md)
- [Streaming HTTP Server with Node.js Streams](https://bun.sh/guides/http/stream-node-streams-in-bun.md)
- [Upload files via HTTP using FormData](https://bun.sh/guides/http/file-uploads.md)
- [Write a simple HTTP server](https://bun.sh/guides/http/simple.md)

### Guides: Binary data

- [Convert a Blob to a DataView](https://bun.sh/guides/binary/blob-to-dataview.md)
- [Convert a Blob to a ReadableStream](https://bun.sh/guides/binary/blob-to-stream.md)
- [Convert a Blob to a string](https://bun.sh/guides/binary/blob-to-string.md)
- [Convert a Blob to a Uint8Array](https://bun.sh/guides/binary/blob-to-typedarray.md)
- [Convert a Blob to an ArrayBuffer](https://bun.sh/guides/binary/blob-to-arraybuffer.md)
- [Convert a Buffer to a blob](https://bun.sh/guides/binary/buffer-to-blob.md)
- [Convert a Buffer to a ReadableStream](https://bun.sh/guides/binary/buffer-to-readablestream.md)
- [Convert a Buffer to a string](https://bun.sh/guides/binary/buffer-to-string.md)
- [Convert a Buffer to a Uint8Array](https://bun.sh/guides/binary/buffer-to-typedarray.md)
- [Convert a Buffer to an ArrayBuffer](https://bun.sh/guides/binary/buffer-to-arraybuffer.md)
- [Convert a DataView to a string](https://bun.sh/guides/binary/dataview-to-string.md)
- [Convert a Uint8Array to a Blob](https://bun.sh/guides/binary/typedarray-to-blob.md)
- [Convert a Uint8Array to a Buffer](https://bun.sh/guides/binary/typedarray-to-buffer.md)
- [Convert a Uint8Array to a DataView](https://bun.sh/guides/binary/typedarray-to-dataview.md)
- [Convert a Uint8Array to a ReadableStream](https://bun.sh/guides/binary/typedarray-to-readablestream.md)
- [Convert a Uint8Array to a string](https://bun.sh/guides/binary/typedarray-to-string.md)
- [Convert a Uint8Array to an ArrayBuffer](https://bun.sh/guides/binary/typedarray-to-arraybuffer.md)
- [Convert an ArrayBuffer to a Blob](https://bun.sh/guides/binary/arraybuffer-to-blob.md)
- [Convert an ArrayBuffer to a Buffer](https://bun.sh/guides/binary/arraybuffer-to-buffer.md)
- [Convert an ArrayBuffer to a string](https://bun.sh/guides/binary/arraybuffer-to-string.md)
- [Convert an ArrayBuffer to a Uint8Array](https://bun.sh/guides/binary/arraybuffer-to-typedarray.md)
- [Convert an ArrayBuffer to an array of numbers](https://bun.sh/guides/binary/arraybuffer-to-array.md)

### Guides: Processes

- [Get the process uptime in nanoseconds](https://bun.sh/guides/process/nanoseconds.md)
- [Listen for CTRL+C](https://bun.sh/guides/process/ctrl-c.md)
- [Listen to OS signals](https://bun.sh/guides/process/os-signals.md)
- [Parse command-line arguments](https://bun.sh/guides/process/argv.md)
- [Read from stdin](https://bun.sh/guides/process/stdin.md)
- [Read stderr from a child process](https://bun.sh/guides/process/spawn-stderr.md)
- [Read stdout from a child process](https://bun.sh/guides/process/spawn-stdout.md)
- [Spawn a child process](https://bun.sh/guides/process/spawn.md)
- [Spawn a child process and communicate using IPC](https://bun.sh/guides/process/ipc.md)


# Hono

> Hono - means flame🔥 in Japanese - is a small, simple, and ultrafast web framework built on Web Standards. It works on any JavaScript runtime: Cloudflare Workers, Fastly Compute, Deno, Bun, Vercel, Netlify, AWS Lambda, Lambda@Edge, and Node.js.

## Docs

- [Full Docs](https://hono.dev/llms-full.txt) Full documentation of Hono. (without examples)
- [Tiny Docs](https://hono.dev/llms-small.txt): Tiny documentation of Hono. (includes only desciption of core)

## Examples

- [Examples](https://github.com/honojs/website/tree/main/examples): List of example files.

## Optional

- [Index](https://hono.dev/docs/index)
- [Third Party](https://hono.dev/docs/middleware/third-party)
- [Basic Auth](https://hono.dev/docs/middleware/builtin/basic-auth)
- [Bearer Auth](https://hono.dev/docs/middleware/builtin/bearer-auth)
- [Body Limit](https://hono.dev/docs/middleware/builtin/body-limit)
- [Cache](https://hono.dev/docs/middleware/builtin/cache)
- [Combine](https://hono.dev/docs/middleware/builtin/combine)
- [Compress](https://hono.dev/docs/middleware/builtin/compress)
- [Context Storage](https://hono.dev/docs/middleware/builtin/context-storage)
- [Cors](https://hono.dev/docs/middleware/builtin/cors)
- [Csrf](https://hono.dev/docs/middleware/builtin/csrf)
- [Etag](https://hono.dev/docs/middleware/builtin/etag)
- [Ip Restriction](https://hono.dev/docs/middleware/builtin/ip-restriction)
- [Jsx Renderer](https://hono.dev/docs/middleware/builtin/jsx-renderer)
- [Jwk](https://hono.dev/docs/middleware/builtin/jwk)
- [Jwt](https://hono.dev/docs/middleware/builtin/jwt)
- [Language](https://hono.dev/docs/middleware/builtin/language)
- [Logger](https://hono.dev/docs/middleware/builtin/logger)
- [Method Override](https://hono.dev/docs/middleware/builtin/method-override)
- [Pretty Json](https://hono.dev/docs/middleware/builtin/pretty-json)
- [Request Id](https://hono.dev/docs/middleware/builtin/request-id)
- [Secure Headers](https://hono.dev/docs/middleware/builtin/secure-headers)
- [Timeout](https://hono.dev/docs/middleware/builtin/timeout)
- [Timing](https://hono.dev/docs/middleware/builtin/timing)
- [Trailing Slash](https://hono.dev/docs/middleware/builtin/trailing-slash)
- [Accepts](https://hono.dev/docs/helpers/accepts)
- [Adapter](https://hono.dev/docs/helpers/adapter)
- [Conninfo](https://hono.dev/docs/helpers/conninfo)
- [Cookie](https://hono.dev/docs/helpers/cookie)
- [Css](https://hono.dev/docs/helpers/css)
- [Dev](https://hono.dev/docs/helpers/dev)
- [Factory](https://hono.dev/docs/helpers/factory)
- [Html](https://hono.dev/docs/helpers/html)
- [Jwt](https://hono.dev/docs/helpers/jwt)
- [Proxy](https://hono.dev/docs/helpers/proxy)
- [Ssg](https://hono.dev/docs/helpers/ssg)
- [Streaming](https://hono.dev/docs/helpers/streaming)
- [Testing](https://hono.dev/docs/helpers/testing)
- [Websocket](https://hono.dev/docs/helpers/websocket)
- [Best Practices](https://hono.dev/docs/guides/best-practices)
- [Examples](https://hono.dev/docs/guides/examples)
- [Faq](https://hono.dev/docs/guides/faq)
- [Helpers](https://hono.dev/docs/guides/helpers)
- [Jsx Dom](https://hono.dev/docs/guides/jsx-dom)
- [Jsx](https://hono.dev/docs/guides/jsx)
- [Middleware](https://hono.dev/docs/guides/middleware)
- [Others](https://hono.dev/docs/guides/others)
- [Rpc](https://hono.dev/docs/guides/rpc)
- [Testing](https://hono.dev/docs/guides/testing)
- [Validation](https://hono.dev/docs/guides/validation)
- [Ali Function-Compute](https://hono.dev/docs/getting-started/ali-function-compute)
- [Aws Lambda](https://hono.dev/docs/getting-started/aws-lambda)
- [Azure Functions](https://hono.dev/docs/getting-started/azure-functions)
- [Basic](https://hono.dev/docs/getting-started/basic)
- [Bun](https://hono.dev/docs/getting-started/bun)
- [Cloudflare Pages](https://hono.dev/docs/getting-started/cloudflare-pages)
- [Cloudflare Workers](https://hono.dev/docs/getting-started/cloudflare-workers)
- [Deno](https://hono.dev/docs/getting-started/deno)
- [Fastly](https://hono.dev/docs/getting-started/fastly)
- [Google Cloud-Run](https://hono.dev/docs/getting-started/google-cloud-run)
- [Lambda Edge](https://hono.dev/docs/getting-started/lambda-edge)
- [Netlify](https://hono.dev/docs/getting-started/netlify)
- [Nodejs](https://hono.dev/docs/getting-started/nodejs)
- [Service Worker](https://hono.dev/docs/getting-started/service-worker)
- [Supabase Functions](https://hono.dev/docs/getting-started/supabase-functions)
- [Vercel](https://hono.dev/docs/getting-started/vercel)
- [Benchmarks](https://hono.dev/docs/concepts/benchmarks)
- [Developer Experience](https://hono.dev/docs/concepts/developer-experience)
- [Middleware](https://hono.dev/docs/concepts/middleware)
- [Motivation](https://hono.dev/docs/concepts/motivation)
- [Routers](https://hono.dev/docs/concepts/routers)
- [Stacks](https://hono.dev/docs/concepts/stacks)
- [Web Standard](https://hono.dev/docs/concepts/web-standard)
- [Context](https://hono.dev/docs/api/context)
- [Exception](https://hono.dev/docs/api/exception)
- [Hono](https://hono.dev/docs/api/hono)
- [Index](https://hono.dev/docs/api/index)
- [Presets](https://hono.dev/docs/api/presets)
- [Request](https://hono.dev/docs/api/request)
- [Routing](https://hono.dev/docs/api/routing)