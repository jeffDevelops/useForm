## Problem

React forms are annoying as hell. Rather than learn some existing library that requires a shit-ton of API knowlege anyway, I just rolled my own that is intended to evolve by
adding new validations to it. It's probably just meant for my purposes, but if you
like the API, you can knick it for yourself.

This doesn't come with any UI--just the logic for validating and maintaining form state.

## Assumptions

The hook assumes that you'll submit some form and that the submission is async, and thus
provides some state for keeping track of whether the submission is happening. Ultimately it saves me from writing `const [loading, setLoading] = useState(false)` in EVERY form ever.

Validation errors are maintained in state, even if you haven't elected to show the validation error to the user. You can use `formState[<my-field>].blurred` to know when the user has seemingly finished interacting with an input, and then display `formErrors.field` if a validation error string exists for that field. Or, you can check `didAttemptSubmit` for whether the user tried to submit the form.

## Peer Dependencies

`validator`

## Usage

```
const {
  /**
   * Whether the async submit is happening; must be set in your form component with setLoading
   */
  loading,

  /**
   * Set this to true when the user submits, and when you know your form is valid; set it to false when the asynchronous submit is finished.
   */
  setLoading,

  /**
   * Whether the user has tried to submit the form -- regardless of whether it's valid or not; set this to true right away in your submit handler.
   */
  didAttemptSubmit,
  setDidAttemptSubmit,

/**
 * The state of the form:
 *
 * {
 *  my-field-name-here: {
 *    blurred: boolean // whether the user directed their focus away from this field
 *    value: string // use this in your controlled-component value prop, and when submitting your form
 *    validation: {
 *      type: // any of the following (more to come)
 *        | 'none'
 *        | 'email'
 *        | 'password'
 *        | 'confirmPassword' (obvi, requires the presence of another field called 'password')
 *        | 'firstName'
 *        | 'lastName'
 *      customError?: string // OPTIONAL: whether you'd like a certain validation message to display instead of the default one
 *      optional?: boolean // OPTIONAL: if true, no validation is run against the input
 *    }
 *  }
 *  another-field: {...}
 * }
 */
 formState,
 dispatchFormAction, // dispatches either 'BLUR_INPUT' or 'UPDATE_VALUE' actions against the state tree

 globalFormError, // can be used to display an error you get back from the submit handler, or one that doesn't pertain to just one field
 setGlobalFormError,

 formInvalid, // helper memoized value to know that, somewhere, an error exists
} = ({
  // Initial State Value
  email: {
    value: '', // '' for an empty input, or provide a value from default props, or from your database for an edit form
    validation: {
      type: 'email',
      customError: 'That's just wrong',
      optional: false // undefined is also acceptable, so you can omit this, and it'll validate by default
    }
  },
  password: {
    value: '',
    blurred: true // set this to true initially, if you want to always show the error, regardless if the user has finished
    validation: {
      type: 'password',
      customError: 'Seriously, THAT'S your password?',
    }
  }

})
```

### Condensed (minimal config)

```
  const {
    loading,
    setLoading,
    didAttemptSubmit,
    setDidAttemptSubmit,
    formState,
    dispatchFormAction,
    globalFormError,
    setGlobalFormError,
    formInvalid,
  } = useForm({
    email: {
      value: '',
      validation: {
        type: 'email',
      }
    },
    password: {
      value: '',
      validation: {
        type: 'password',
      }
    }
  })
```

### Update a value

```
  <input onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
    dispatchFormAction({
      type: 'UPDATE_VALUE',
      field: 'email',
      value: e.target.value
    })
  }/>
```

### Generically update a value (assumes name matches the top level key name provided in the hook argument)

```
const { dispatchFormAction } = useForm({
  email: { // * must match input name prop
    value: '',
    validation: { type: 'email' }
  },
  // ...
})

// ...

// Generic onChange handler
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  dispatchFormAction({
    type: 'UPDATE_VALUE',
    field: e.target.name, // * here's why they must match
    value: e.target.value
  })
}

// ...

  <input
    name="email" // * must match key name
    onChange={handleInputChange}
  />

```

### Blur a field

```
  <input onBlur={() => dispatchFormAction({
    type: 'BLUR_INPUT',
    field: 'password',
  })}/>
```

### Display an input error if the user has diverted their focus from this input, or has tried to submit the form, but the email is still invalid

```
  <input id="login_form_input" />
  {(didAttemptSubmit || (!!formErrors.email && formState.email.blurred) && (
    <div className="error_message">
      {formErrors.email}
    </div>
  )}
```

### Display a form error

```
<h1>Log In</h1>

{globalFormError && <div className="error_message>{ globalFormError }</div>}

<form>
// ...
```

### Handle submission

```
const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()
  setDidAttemptSubmit(true) // regardless of whether the form is valid, set this to true here

  if (!formInvalid) {
    await someSubmitFunction()
  }
},[formInvalid])
```

### Disable the submit button after the user tries to submit but errors exist, or the async submission is happening

```
  // ...

    <button type="submit" disabled={loading || (didAttemptSubmit && formInvalid)}>Log In</button>

  </form>
```
