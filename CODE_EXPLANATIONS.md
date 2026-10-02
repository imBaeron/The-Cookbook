# Cookbook App — Code Explanations

A complete walkthrough of every concept used in this app, from the absolute
basics up to the more advanced pieces. Written so you can read it once,
understand the reasoning, and then explain it confidently to your instructor
and classmates — including follow-up questions like "what are hooks?" or
"why is this file here?"

The in-code comments (in every `.js` file) are the quick-reference version of
this. This document is the full explanation behind them.

---

## Part 1: The building blocks

### 1.1 What React Native and Expo actually are

**React Native** lets you build a phone app using JavaScript and React. Your
code doesn't draw web pages — it tells the phone to display real native UI
elements. A `<View>` becomes a real iOS or Android view, not an HTML `<div>`.

**Expo** is a toolkit on top of React Native that handles the hard build and
setup work. **Expo Go** is a ready-made app on your phone. When you run
`npx expo start`, your computer starts a dev server (called **Metro**) that
bundles your code, and Expo Go downloads that bundle over Wi-Fi and runs it.
That's why scanning the QR code works without installing anything custom.

**Fast Refresh** is why you see changes instantly when you save a file.
Metro sends the updated code to your phone, and the screen updates without a
full restart. It's the best way to learn what a line does: change a value,
save, and watch.

### 1.2 Components and JSX

A **component** is a function that returns what should appear on screen.

```js
export default function RecipeDetailScreen({ route, navigation }) {
  return <View>...</View>;
}
```

The function name starts with a capital letter, which is how React tells
components apart from normal functions.

The tag-like syntax inside `return` is **JSX**. It looks like HTML but it's
really JavaScript. Anything inside `{ }` in JSX is evaluated as JavaScript:

```jsx
<Text>{recipe.title}</Text>              // shows the title value
<Text>{recipe.readyInMinutes} min</Text> // shows "20 min"
```

A component can only return **one root element**, so if you need several
siblings, wrap them in a `<View>`.

**Components inside components:** `<RecipeCard recipe={item} />` uses
another component we wrote, the same way you use `<View>`. Building screens
from small reusable pieces is the core idea of React.

### 1.3 import and export

Every file is its own module. It can't see other files unless you import
from them.

```js
export default function HomeScreen() {...}   // one "main" export per file
import HomeScreen from '../screens/home/HomeScreen';   // no braces

export const colors = {...};                 // a "named" export (can be many per file)
import { colors } from '../constants/colors';          // needs braces, exact name
```

The path `'../../constants/colors'` means "go up one folder, up again, then
into constants". `./` means "this same folder". Imports without a path
(`'react-native'`, `'zustand'`) come from installed packages in
`node_modules`.

### 1.4 The core components

| Component | What it is | Notes |
|---|---|---|
| `View` | An invisible box that groups and lays out other things (like `<div>`) | Doesn't scroll. Used for layout, spacing and backgrounds. |
| `Text` | Displays text | **All text must be inside `<Text>`.** Raw text in a `<View>` crashes the app. |
| `TouchableOpacity` | Makes anything pressable and dims it slightly when pressed | Uses `onPress`. `activeOpacity` controls how much it dims. |
| `FlatList` | A scrolling list that only renders rows currently on screen | Better than `ScrollView` for lists because it's memory efficient. |
| `ScrollView` | A scrolling container that renders all its children at once | Used on Recipe Detail, where the content is short and fixed. |
| `TextInput` | The typing box | `value`, `onChangeText`, `placeholder`, `onSubmitEditing`. |
| `Image` | Displays a picture | `source={{ uri: url }}` for web images. |
| `Ionicons` | An icon from the `@expo/vector-icons` package | `name`, `size`, `color`. |
| `Alert.alert(...)` | A native popup dialog | Used when you tap "Add to Shopping List". |

**FlatList props used in the app:**
- `data`: the array to display.
- `renderItem`: a function called once per item that returns what that row looks like.
- `keyExtractor`: returns a unique **string** ID for each item so React can track rows. That's why the code does `String(item.id)`, because our IDs are numbers.
- `ListHeaderComponent`: stuff that appears above the list and scrolls with it. Home uses this for the greeting, search bar and "Today's picks".
- `ListEmptyComponent`: what to show when `data` is empty, like "No saved recipes yet".
- `contentContainerStyle`: styles for the inside of the scroll area (used for bottom padding).

### 1.5 Styling: how "CSS" works here

**There is no CSS.** Styles are plain JavaScript objects, and you connect
them to a component with the `style` prop.

```js
<View style={styles.card}>...</View>

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
  },
});
```

Rules that differ from web CSS:
- Property names are **camelCase** (`backgroundColor`, not `background-color`).
- Numbers have **no units**. `padding: 16` means 16 density-independent pixels, which look the same size across different phones.
- Percentages and some values are strings: `width: '100%'`.
- Styles don't inherit from parent to child (except inside `<Text>`). A `<View>` with a background color doesn't pass it down.
- `StyleSheet.create` doesn't change how anything looks. It just checks for typos and organizes styles. You could pass a plain object and it would look the same.

**Style arrays** apply several styles in order, with later ones winning:

```js
style={[styles.button, style]}                                 // BookmarkButton: base style, then any override passed in
style={[styles.modeButton, active && styles.modeButtonActive]} // SearchBar: extra style only if active
```

When the condition is `false`, React Native ignores it, which is why `&&`
works there.

**Design tokens.** Instead of typing `#3E2723` in twenty places, `colors.js`
defines names like `colors.cover`, and `theme.js` defines `spacing` (xs to
xxl), `radius`, `fonts` and `typography`. Change one value there and every
screen using it updates. That's why the app looks consistent.

### 1.6 Flexbox: how layout works

Every `<View>` is a **flex container**. Flexbox is the system that decides
how children are arranged. The key concept is two axes:

- **Main axis:** the direction children are laid out. The default in React Native is **column** (top to bottom).
- **Cross axis:** perpendicular to the main axis.

| Property | What it does | Visual effect if changed |
|---|---|---|
| `flexDirection: 'row'` | Lays children left to right | Items that were stacked vertically now sit side by side (used in tag rows, meta rows, and the tab-style toggle). |
| `justifyContent` | Positions along the **main** axis | In a row: `'space-between'` pushes items to opposite ends (like "Today's picks" and "Shuffle"). |
| `alignItems` | Positions along the **cross** axis | In a row: `'center'` vertically centers the items. |
| `flex: 1` | "Take all remaining space" | `flex: 1` on a screen's root View makes it fill the whole screen. Remove it and the screen collapses to its content. |
| `flexWrap: 'wrap'` | Lets items drop to the next line | The tag pills wrap instead of overflowing. |
| `gap` | Space between children | Change `gap: 6` to `gap: 20` and the pills spread apart. |

**Spacing model:**
- `padding` is space **inside** an element, between its border and its content.
- `margin` is space **outside** an element, pushing other things away.
- `paddingHorizontal` / `paddingVertical` are shortcuts for left+right and top+bottom.
- `borderRadius` rounds corners. `borderWidth` with `borderColor` draws an outline. `radius.pill` (999) makes fully rounded ends.

**Other properties you'll see:**
- `position: 'absolute'` takes an element out of the normal flow and places it relative to its parent using `top`, `right`, and so on. That's how the bookmark icon floats over the recipe photo.
- `overflow: 'hidden'` clips children to the parent's rounded corners. Without it, the image would poke out past the card's rounded corners.
- `numberOfLines={2}` on `<Text>` cuts text off with "…" after two lines.

### 1.7 How to know what a visual change does

Use this workflow for anything: **change one value, save, look at the
phone.** A few examples specific to this app:

| Change this | You'll see |
|---|---|
| `colors.cover` in `colors.js` | The header bars, tab bar and step-number circles all change color (everything using that token). |
| `spacing.lg` in `theme.js` | Padding around most screens grows or shrinks. |
| `radius.md` | Card and box corners become rounder or sharper everywhere. |
| `imageWrap.height: 140` in `RecipeCard` | The photo area of every recipe card gets taller or shorter. |
| `flexDirection: 'row'` to `'column'` on `metaRow` | Cook time and servings stack vertically instead of sitting side by side. |
| `fonts.serif` in `theme.js` | Every title changes typeface. |

### 1.8 JavaScript features used throughout

These come up in almost every file, so be able to explain each one in a
sentence:

- **Arrow functions:** `(item) => item.id` is a short function. `(s) => s.bookmarkedIds` means "given `s`, return `s.bookmarkedIds`".
- **Destructuring:** pulls values out of an object or array.
  - `const { recipeId } = route.params;` is the same as `const recipeId = route.params.recipeId`.
  - `const [query, setQuery] = useState('')` pulls two things out of an array.
- **Spread `...`:** copies things into a new object or array.
  - `[...state.bookmarkedIds, id]` is a new array containing everything from the old one plus `id`.
  - `{ ...item, checked: !item.checked }` is a copy of `item` with `checked` flipped.
  - `...headerAppearance` copies all the header style settings into the options object.
- **Template literals:** backtick strings with `${}` inside, like `` `${recipe.readyInMinutes} min` ``.
- **Ternary:** `condition ? A : B`, like `saved ? 'bookmark' : 'bookmark-outline'`.
- **`&&` for conditional display:** `{tags.length > 0 && <View>...</View>}` shows the View only if the condition is true.
- **Optional chaining `?.`:** `route.params?.query` returns `undefined` instead of crashing if `params` doesn't exist.
- **Nullish coalescing `??`:** `r?.title ?? ''` means "use the title, but if it's null or undefined, use an empty string".
- **Array methods:**
  - `.map(fn)` transforms each item and returns a new array. Used to turn data into UI.
  - `.filter(fn)` keeps items where `fn` returns true.
  - `.find(fn)` returns the first match.
  - `.includes(x)` returns true if the array contains `x`.
  - `.sort(fn)`, `.slice(0, n)`, `.findIndex(fn)`.
  - `.filter(Boolean)` removes empty or falsy values (used to drop blank ingredient names).

---

## Part 2: Core React concepts

### 2.1 Props: passing data into a component

**Props** are the inputs to a component, like function arguments. The
parent passes them, and the child reads them but never changes them.

```jsx
// Parent (HomeScreen) passes props:
<RecipeCard recipe={item} saved={true} onPress={() => ...} />

// Child (RecipeCard) receives them:
export default function RecipeCard({ recipe, onPress, saved = false, onToggleSave }) {
```

The `{ recipe, onPress, ... }` in the parameter list is destructuring the
props object. `saved = false` is a **default value** used when the parent
doesn't pass one.

Props can be **functions**. `onPress` and `onToggleSave` are functions the
parent hands down so the child can say "something happened, run this". This
is how a child talks back to its parent.

### 2.2 State: data that changes

**State** is data a component remembers that can change over time. When
state changes, React **re-renders** the component, meaning it calls the
function again with the new values and updates the screen.

```js
const [query, setQuery] = useState('');
```

- `query` is the current value (starts as an empty string).
- `setQuery` is the only correct way to change it.
- Calling `setQuery('pasta')` makes React re-run `HomeScreen`, now with `query === 'pasta'`.

Never do `query = 'pasta'` directly. React wouldn't know anything changed
and the screen wouldn't update.

| | Props | State |
|---|---|---|
| Owned by | The parent | The component itself |
| Can the component change it? | No | Yes, via the setter |
| Example | `recipe` in RecipeCard | `query` in HomeScreen |

### 2.3 Hooks: what they are and how they work

This is the question your classmate got, so make sure you can explain it
well.

**A hook is a special function (its name starts with `use`) that lets a
function component "hook into" React features like remembering data or
running code at certain times.** Before hooks, only class components could
hold state. Hooks let simple functions do it.

Why they're needed: a component is just a function that runs every time it
re-renders, so any normal variable inside is recreated fresh each time.
Hooks give React a place to **keep values between renders**.

The hooks in this app:

| Hook | Where | What it does |
|---|---|---|
| `useState` | Home, Search Results, Detail, Saved | Remembers a value and re-renders when it changes. |
| `useEffect` | Home, Search Results, Detail, Saved | Runs code **after** the screen renders, in response to something. |
| `useFonts` | App.js | Loads custom fonts and tells you when they're ready. |
| `useAppStore` | Home, Search, Detail, Saved, Shopping | Our custom hook that reads shared state (Part 4). |

**Rules of Hooks** (a likely question):
1. Only call hooks at the **top level** of a component, never inside loops, conditions or nested functions. React tracks hooks by the order they're called, so the order must be identical every render.
2. Only call them inside components or other hooks.

This is why in `RecipeDetailScreen`, all hooks come **before** the
`if (!recipe) return ...` line. If a hook came after an early return, the
hook order could change between renders.

### 2.4 useEffect in depth

Rendering should only build UI. Anything else, like fetching data or
changing the navigation title, is a **side effect** and belongs in
`useEffect`.

```js
useEffect(() => {
  getRandomRecipes(4).then(setPicks);
}, []);
```

The array at the end is the **dependency array**, and it controls when the
effect runs:

| Dependency array | Runs when |
|---|---|
| `[]` | Once, after the first render (on mount) |
| `[query, mode]` | After the first render, and again whenever `query` or `mode` changes |
| (none) | After every render (rarely what you want) |

Real examples from the app:
- **Home:** `[]`. Load 4 random recipes once when the screen appears.
- **Search Results:** `[query, mode]`. Re-run the search if either changes.
- **Recipe Detail:** `[recipeId]`. Reload the recipe if a different one is opened.
- **Saved:** `[bookmarkedIds]`. Reload the saved recipes whenever a bookmark is added or removed.

**Why not just call `getRandomRecipes(4).then(setPicks)` directly in the
component body?** It would create an infinite loop. Setting state triggers
a re-render, which runs the fetch again, which sets state again, and so on.
`useEffect` with `[]` breaks the loop by running it only once.

### 2.5 Controlled components and "lifting state up"

`SearchBar` doesn't keep its own text. The **parent (HomeScreen)** owns
`query` and `mode`, and passes them down with the setters:

```jsx
<SearchBar value={query} onChangeText={setQuery} mode={mode} onModeChange={setMode} onSubmit={handleSubmit} />
```

This is called a **controlled component**. The parent is the single source
of truth, so it can read the query when submitting.

`BookmarkButton` works the same way. It doesn't remember whether it's
saved — it's told with `saved` and `onToggle`. We changed it to work like
this to fix a bug where the icon and the real saved state got out of sync
(see Part 4.3).

### 2.6 Conditional rendering and lists

- `if (!recipe) return <Text>Recipe not found.</Text>;` (an early return) shows a fallback until the data exists.
- `{condition && <X />}` shows X only when the condition is true.
- `{ingredients.map((ing) => <View key={...}>...</View>)}` turns an array of data into an array of UI elements.

**The `key` prop:** whenever you render a list, each item needs a unique
`key` so React can track which item is which when the list changes.
Ingredients use `` key={`${ing.name}-${ing.unit}`} `` and steps use the
index.

### 2.7 Async code: promises, `.then`, `async/await`

Fetching data takes time, so the result doesn't come back instantly.
JavaScript handles this with **Promises**, which are objects meaning "the
answer will arrive later".

```js
getRandomRecipes(4).then(setPicks);
```

This means "ask for 4 recipes; when the answer arrives, pass it to
`setPicks`". `async/await` is the same idea in a different style.

`Promise.all([...])` in `SavedRecipesScreen` waits for a whole list of
promises to finish, one lookup per bookmarked ID, and gives back all the
results together.

**Why is our local data async when it's instant?** So that when you swap to
the real Spoonacular API later, the screens don't need to change. They
already expect "an answer that arrives later".

---

## Part 3: Navigation

### 3.1 The big picture

React Navigation is the library that moves between screens. Our structure:

```
NavigationContainer                 (App.js: the "brain" that tracks where you are)
└── Tab Navigator                   (MainTabNavigator: bottom tabs)
    ├── "RecipeStack" tab  →  Stack Navigator  (RecipeStackNavigator)
    │                          ├── Home
    │                          ├── SearchResults
    │                          └── RecipeDetail
    ├── "Saved" tab  →  SavedRecipesScreen
    └── "ShoppingList" tab  →  ShoppingListScreen
```

- A **Tab navigator** shows tabs at the bottom, and switching tabs swaps the whole screen.
- A **Stack navigator** works like a pile of cards. `navigate` puts a new screen on top, and going back removes it.
- **Nested navigators:** the Cookbook tab contains a whole stack inside it. This lets Home → Results → Detail have their own back-navigation, while the tabs stay visible at the bottom.

### 3.2 Registering screens

```jsx
<Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ title: '' }} />
```

- `name` is the ID used to navigate to it.
- `component` is the screen to show.
- `options` are settings for that screen, like its header title.

Every screen component automatically receives two props: **`navigation`**
(used to move around) and **`route`** (info about how this screen was
opened).

### 3.3 Moving between screens and passing data

```js
navigation.navigate('SearchResults', { query, mode });   // Home: go there and pass data
const { query = '', mode = 'name' } = route.params ?? {}; // SearchResults: read the data
```

The second argument is the **params** object: data sent along to the
destination. `= ''` and `= 'name'` are defaults in case the value is
missing.

Recipe Detail only receives `{ recipeId }` and looks up the rest itself
with `getRecipeById`. Passing just an ID and looking it up is cleaner than
passing the whole recipe object.

**Navigating across tabs** (Saved → a recipe's detail screen):

```js
navigation.navigate('RecipeStack', { screen: 'RecipeDetail', params: { recipeId: item.id } });
```

Since `RecipeDetail` lives inside the Cookbook tab's stack, from the Saved
tab you must say "go to the RecipeStack tab, and inside it open the
RecipeDetail screen".

`navigation.setOptions({ title: r?.title ?? '' })` in Recipe Detail changes
the header title after the recipe loads. The header can't know the title in
advance, so it starts blank and is filled in.

### 3.4 Headers and options

- `headerShown: false` on the tab navigator's default, plus `headerShown: true` on Saved and Shopping List. The Cookbook tab's header is provided by its inner stack, so showing both would create two stacked headers.
- `headerAppearance` in `theme.js` is one shared object (cocoa background, paper-colored text, serif font). Every navigator spreads it in with `...headerAppearance`, so every header matches from a single source.
- `animation: 'none'` on the stack makes screens switch instantly.
- **`screenOptions` as a function:** in the tab navigator, `screenOptions={({ route }) => ({...})}` gets info about each tab, so we can choose the icon per tab using `ICONS[route.name]`. The template string `` `${ICONS[route.name]}-outline` `` builds the outlined version of the icon name when a tab isn't selected.
- `tabBarStyle` only sets the color and border. We deliberately **don't** set height or padding so React Navigation handles the phone's bottom safe area automatically. (We learned this the hard way — see Part 5.2.)

---

## Part 4: Shared state with Zustand

### 4.1 The problem it solves

State from `useState` lives inside **one component**. But bookmarks are
used on Home, Search Results, Recipe Detail and Saved — separate screens.
Screens on different tabs can't pass props to each other. We need state
that lives **outside** every screen and that any screen can read and
change. That's what Zustand is: **"`useState`, but shared across the whole
app."**

### 4.2 How the store is built

```js
export const useAppStore = create((set) => ({
  bookmarkedIds: [],
  toggleBookmark: (id) =>
    set((state) => ({
      bookmarkedIds: state.bookmarkedIds.includes(id)
        ? state.bookmarkedIds.filter((existingId) => existingId !== id)
        : [...state.bookmarkedIds, id],
    })),
  shoppingListItems: [],
  ...
}));
```

- `create(...)` builds the store and returns a **hook** (`useAppStore`).
- The object holds **data** (`bookmarkedIds`, `shoppingListItems`) and **actions** (`toggleBookmark`, and so on) together.
- `set(...)` updates the store. It merges what you return into the existing state, so you only return the pieces that changed.
- `set((state) => ...)` gives you the current state to build the new one from.

### 4.3 Reading from the store: selectors (and the bug we fixed)

```js
const bookmarkedIds = useAppStore((s) => s.bookmarkedIds);
const toggleBookmark = useAppStore((s) => s.toggleBookmark);
```

The function inside is a **selector**: "I only care about this piece."
Zustand re-renders the component **only when that piece changes**.

**The bug we actually hit:** we used to select a helper function
`isBookmarked`. Since that function never changes, Zustand never
re-rendered the screen, and the bookmark icon stayed stale until something
else happened to re-render it. The fix was to select the real **data**
(`bookmarkedIds`) so the screen reacts when it changes. The rule: always
select the data you want to react to, not a function that reads it.

### 4.4 Immutability

Notice `toggleBookmark` never uses `.push()` or edits the array directly.
It always builds a **new** array with `filter` or the spread
`[...old, new]`. React and Zustand detect changes by checking whether the
**reference** is different. If you mutate the old array, the reference
stays the same, so nothing updates. Always make a new copy.

### 4.5 The shopping list merge (`ingredientMerge.js`)

This is a pure function with no React in it. Its job: add a recipe's
ingredients to the list without duplicates.

```js
function keyFor(name, unit) {
  return `${name.trim().toLowerCase()}__${(unit || '').trim().toLowerCase()}`;
}
```

This builds a unique ID like `garlic__cloves`. Then for each new
ingredient:
1. Build its key.
2. `findIndex` to see if the list already has an item with that ID.
3. **If yes:** make a copy of that item with the amounts **added together**, and add the recipe title to `fromRecipes`.
4. **If no:** push a new item with `checked: false`.

So if two recipes both need "garlic, cloves", you get one entry with the
summed amount and "from: Recipe A, Recipe B". Names are lowercased so
"Garlic" and "garlic" match, and units are part of the key so "1 cup" and
"200 g" of something don't get wrongly added together.

---

## Part 5: The data layer

### 5.1 The chain

```
mocks/recipes.js  →  data/recipeRepository.js  →  Screens  →  Components
   (the data)         (functions to get it)      (ask for)     (display it)
```

- **`mocks/recipes.js`** is a plain array of 8 recipe objects. "Mock" means fake or placeholder data.
- **`recipeRepository.js`** holds four functions. Screens never read the array directly — they only call these:
  - `searchByName(query)`: lowercases and trims the query, keeps recipes whose title `.includes` it.
  - `searchByIngredients(list)`: for each recipe, counts how many of the wanted ingredients appear in its ingredient names, drops recipes with zero matches, sorts the best matches first.
  - `getRecipeById(id)`: `.find`s one recipe (or returns `null`).
  - `getRandomRecipes(count)`: shuffles a copy and takes the first `count`.
- **Shuffle:** the helper loops backwards through the array, swapping each item with a random earlier one (the Fisher–Yates method). It works on a **copy** (`[...array]`) so the original data isn't disturbed.

### 5.2 Why this layer exists (a likely question)

If screens read `recipes` directly, moving to a real API would mean editing
every screen. With a repository, only that **one file** changes, and the
screens keep calling `searchByName(...)` as before. That's why the
functions are `async` even though the data is local.

This same "don't fight the library's defaults" lesson came up with the tab
bar: an early version manually set a fixed `height`/`paddingBottom` on the
tab bar, which accidentally broke React Navigation's own automatic safe-area
handling (the part that keeps icons from being covered by the phone's home
indicator/gesture bar). The fix was to simply not override those two
properties at all — let the library do what it already does correctly.

---

## Part 6: App.js, line by line in concept

```js
SplashScreen.preventAutoHideAsync();
```
Keeps the phone's startup splash screen visible so users don't see a blank
screen while fonts load.

```js
const [fontsLoaded] = useFonts({ Fraunces_600SemiBold, ..., LibreFranklin_400Regular, ... });
```
The `useFonts` hook downloads custom fonts and returns `[true]` once ready.

```js
useEffect(() => { if (fontsLoaded) SplashScreen.hideAsync(); }, [fontsLoaded]);
if (!fontsLoaded) return null;
```
When fonts finish, hide the splash. Until then, render nothing. Without
this, text would flash in the wrong font or crash.

```jsx
<SafeAreaProvider>              // measures notch/status bar/gesture-bar sizes so navigation can avoid them
  <GestureHandlerRootView style={{ flex: 1 }}>   // required by the navigation library for swipe gestures
    <NavigationContainer theme={{...DefaultTheme, colors: {...}}}>   // the navigation brain + our colors
      <StatusBar style="light" />    // white clock/battery icons on the dark header
      <MainTabNavigator />           // the actual app
```

The `theme` uses `...DefaultTheme` so we keep every setting the library
expects (including `fonts`, which caused an earlier "regular of undefined"
error when we left it out) and only override the colors we care about.

**Wrappers like these ("providers")** make something available to
everything inside them. That's why they wrap the whole app.

---

## Part 7: Why each file is necessary

| File | Purpose | If you deleted it |
|---|---|---|
| `App.js` | Entry point: fonts, splash, navigation setup | The app can't start |
| `constants/colors.js` | The color palette | Every file importing colors errors out |
| `constants/theme.js` | Fonts, spacing, radius, text styles, shared header style | Same, plus inconsistent headers |
| `navigation/MainTabNavigator.js` | Bottom tabs | No tab bar, no way to reach Saved/Shopping |
| `navigation/RecipeStackNavigator.js` | Home → Results → Detail | You couldn't open search results or recipes |
| `screens/home/HomeScreen.js` | Search + random picks | No main screen |
| `screens/home/SearchResultsScreen.js` | Shows search matches | Searching does nothing |
| `screens/recipe/RecipeDetailScreen.js` | Full recipe, bookmark, add to list | Can't view a recipe |
| `screens/saved/SavedRecipesScreen.js` | Bookmarked recipes | Saved tab is empty/broken |
| `screens/shoppingList/ShoppingListScreen.js` | Checkable list | Shopping tab is broken |
| `components/RecipeCard.js` | Reusable recipe preview | Home, Search, Saved would each need their own copy |
| `components/SearchBar.js` | Input + name/ingredient toggle | No search UI |
| `components/BookmarkButton.js` | The bookmark icon toggle | No bookmarking UI |
| `data/recipeRepository.js` | The 4 data functions | Screens have no way to get recipes |
| `mocks/recipes.js` | The hardcoded recipes | Nothing to display |
| `store/useAppStore.js` | Shared bookmarks + shopping list | Screens couldn't share state |
| `utils/ingredientMerge.js` | Combines duplicate ingredients | Shopping list would show repeats |

**Libraries and why:**
- `@react-navigation/*` for screen navigation.
- `react-native-screens` for native screen containers.
- `react-native-safe-area-context` to avoid notches and system bars.
- `react-native-gesture-handler` for gesture support.
- `expo-font`, `expo-splash-screen` and `@expo-google-fonts/*` for custom fonts and the launch screen.
- `expo-status-bar` for the status bar color.
- `@expo/vector-icons` for icons.
- `zustand` for shared state.

---

## Part 8: Questions you're likely to get, with short answers

**"What are hooks and how do they work?"**
Special functions starting with `use` that let a function component
remember data between renders (`useState`) or run code after rendering
(`useEffect`). React tracks them by the order they're called, which is why
they must always be called in the same order at the top level.

**"Why `useEffect` and not just running the code directly?"**
Code in the component body runs on every render. Fetching and setting state
there would trigger a re-render, which fetches again, forever. `useEffect`
with `[]` runs it once.

**"What does the empty `[]` mean?"**
It's the dependency list. Empty means "run once when the screen first
appears". With values in it, the effect re-runs whenever they change.

**"Why did you use Zustand instead of `useState`?"**
`useState` is local to one component. Bookmarks and the shopping list are
needed by several separate screens, so they need to live in one shared
place.

**"Why is there a repository file if the data is already in the app?"**
It separates "where data comes from" from "how it's displayed", so
switching to a real API only changes that one file.

**"Why are the functions `async` if the data is local?"**
To keep the same shape a real API would have, so screens won't need
rewriting later.

**"What's the difference between props and state?"**
Props are passed in from the parent and can't be changed by the child.
State is owned by the component and changed with its setter, and changing
it re-renders the screen.

**"Why do lists need a `key`?"**
So React can identify which item is which when the list changes, and
update only what changed.

**"Why do you copy arrays with `...` instead of `push`?"**
React and Zustand detect changes by comparing references. Mutating the
same array keeps the same reference, so the screen wouldn't update.

**"Why `flex: 1` on screens?"**
It makes the View expand to fill all the available space. Without it the
View would shrink to fit its content.

**"Why is the `RecipeStack` tab's header hidden?"**
Its inner stack navigator already provides headers for Home, Results and
Detail, so showing the tab's header too would stack two headers.

**"Why does the bookmark icon change instantly on every screen?"**
Every screen reads the same `bookmarkedIds` from one shared store. When it
changes, every screen subscribed to it re-renders.

**"What happens when you tap 'Add to Shopping List'?"**
`addIngredientsFromRecipe` runs `mergeIngredientsIntoList`, which adds new
items or sums amounts on duplicates. The store updates, and the Shopping
tab re-renders because it's subscribed to `shoppingListItems`.

---

## Part 9: Suggested reading order

The order matters — reading files out of order means hitting imports you
haven't seen yet, which makes everything feel more tangled than it is.
Here's an order that builds understanding layer by layer, roughly following
how data flows through the app.

**1. Foundation — no logic yet, just values**
- `src/constants/colors.js`
- `src/constants/theme.js`

These just define values. Nothing to "understand" beyond "this is where
design tokens live."

**2. The data itself**
- `src/mocks/recipes.js` — just look at the shape of one recipe object
- `src/data/recipeRepository.js` — the four functions that read that data

Now you know what a "recipe" looks like and how screens will ask for it.

**3. Shared state**
- `src/utils/ingredientMerge.js` — a plain function, easiest thing in the app
- `src/store/useAppStore.js` — references `ingredientMerge.js`, so read that first

**4. Small reusable components (the building blocks of screens)**
- `src/components/BookmarkButton.js`
- `src/components/SearchBar.js`
- `src/components/RecipeCard.js` — uses `BookmarkButton` internally, so read that one first

**5. Navigation structure (the skeleton)**
- `src/navigation/RecipeStackNavigator.js`
- `src/navigation/MainTabNavigator.js` — references `RecipeStackNavigator`, so read that one first

At this point you know *what screens exist and how they connect*, even
though you haven't read the screens themselves yet.

**6. The screens, in the order a user actually encounters them**
- `src/screens/home/HomeScreen.js`
- `src/screens/home/SearchResultsScreen.js`
- `src/screens/recipe/RecipeDetailScreen.js`
- `src/screens/saved/SavedRecipesScreen.js`
- `src/screens/shoppingList/ShoppingListScreen.js`

By now every import at the top of these files is something you've already
read, so nothing feels like a mystery reference.

**7. The entry point, last**
- `App.js`

This seems backwards since it's technically where the app "starts," but it
mostly just wires together `MainTabNavigator` (which you now understand)
plus font-loading boilerplate. Reading it last means every piece it
mentions is already familiar, instead of hitting `MainTabNavigator` for the
first time with no context.

**For the actual presentation walkthrough,** flip steps 1–5 and 6–7 around
and lead with the user-facing story instead: start at `App.js` →
`MainTabNavigator` → `HomeScreen`, and dip into `RecipeCard`, `useAppStore`,
or `recipeRepository` *when they come up naturally* ("tapping a card calls
this function, which lives here..."). Reading order for learning yourself
and presentation order for explaining to an audience don't have to be the
same thing — the order above is better for the first few times you read the
code; a user-journey order is usually clearer when presenting live.
