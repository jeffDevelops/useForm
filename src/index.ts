import {
  useState,
  useReducer,
  useCallback,
  useEffect,
  useMemo,
  Reducer,
} from 'react'
import validator from 'validator'

export type FormFieldOptions =
  | 'none'
  | 'email'
  | 'password'
  | 'passwordConfirmation'
  | 'firstName'
  | 'lastName'

export type Fields<T extends {} = Record<string | number | symbol, unknown>> = {
  [Property in keyof T /* field identifier */]: {
    blurred?: boolean /* Whether the field was touched */
    value: string /* actual value of the input */
    validation: {
      type: FormFieldOptions /* how to validate this field */
      customError?: string /* allow consumer forms to specify their own error copy */
      optional?: boolean
    }
  }
}

export type Errors<T extends {} = Record<string | number | symbol, unknown>> = {
  [Property in keyof T]: string /* empty string if valid */
}

export type FormAction<
  T extends {} = Record<string | number | symbol, unknown>
> =
  | {
      type: 'UPDATE_VALUE'
      field: keyof T
      value: string
    }
  | {
      type: 'BLUR_INPUT'
      field: keyof T
    }

export type ErrorAction<
  T extends {} = Record<string | number | symbol, unknown>
> = {
  type: 'UPDATE_ERROR'
  field: keyof T
  error: string
}

const errorsReducer = <
  T extends {} = Record<string | number | symbol, unknown>
>(
  state: Errors<T>,
  action: ErrorAction<T>
) => {
  switch (action.type) {
    case 'UPDATE_ERROR': {
      return {
        ...state,
        [action.field]: action.error,
      }
    }
    default:
      return state
  }
}

const fieldsReducer = <T = Record<string | number | symbol, unknown>>(
  state: Fields<T>,
  action: FormAction<T>
) => {
  switch (action.type) {
    case 'UPDATE_VALUE': {
      return {
        ...state,
        [action.field]: {
          ...state[action.field],
          value: action.value.trim(),
        },
      }
    }
    case 'BLUR_INPUT': {
      return {
        ...state,
        [action.field]: {
          ...state[action.field],
          blurred: true,
        },
      }
    }
    default:
      return state
  }
}

export const useForm = <T extends Record<string | number, unknown>>(
  initialState: Fields<T>
) => {
  const [loading, setLoading] = useState(false)
  const [didAttemptSubmit, setDidAttemptSubmit] = useState(false)
  const [formState, dispatchFormAction] = useReducer<
    Reducer<Fields<T>, FormAction<T>>
  >(fieldsReducer, initialState)
  const [errorState, dispatchErrorAction] = useReducer<
    Reducer<Errors<T>, ErrorAction<T>>
  >(
    errorsReducer,
    Object.keys(initialState).reduce((acc: Errors<T>, current: keyof T) => {
      acc[current] = ''
      return acc
    }, {} as Errors<T>)
  )
  const [globalFormError, setGlobalFormError] = useState<null | string>(null)

  const validate = useCallback(() => {
    const formFields = Object.keys(formState)
    formFields.forEach((fieldName) => {
      const field = formState[fieldName]

      const dispatchValid = (fieldName: keyof T) =>
        dispatchErrorAction({
          type: 'UPDATE_ERROR',
          field: fieldName,
          error: '',
        })

      /* Don't validate the field if not required */
      if (formState[fieldName].validation.optional)
        return dispatchValid(fieldName)

      switch (field.validation.type) {
        case 'email': {
          if (!field.value.length) {
            return dispatchErrorAction({
              type: 'UPDATE_ERROR',
              field: fieldName,
              error: 'Please provide an email',
            })
          } else if (!validator.isEmail(field.value as string)) {
            return dispatchErrorAction({
              type: 'UPDATE_ERROR',
              field: fieldName,
              error:
                formState[fieldName].validation.customError ||
                'Please provide a valid email',
            })
          } else {
            return dispatchValid(fieldName)
          }
        }

        case 'password': {
          if (validator.isLength(field.value as string, { min: 6, max: 128 })) {
            return dispatchValid(fieldName)
          } else {
            return dispatchErrorAction({
              type: 'UPDATE_ERROR',
              field: fieldName,
              error:
                formState[fieldName].validation.customError ||
                'Please provide a password of at least 6 characters',
            })
          }
        }

        case 'passwordConfirmation': {
          if (field.value !== formState['password']?.value) {
            return dispatchErrorAction({
              type: 'UPDATE_ERROR',
              field: fieldName,
              error:
                formState[fieldName].validation.customError ||
                'Passwords do not match',
            })
          } else {
            return dispatchValid(fieldName)
          }
        }

        case 'firstName': {
          if (!field.value.length) {
            return dispatchErrorAction({
              type: 'UPDATE_ERROR',
              field: fieldName,
              error:
                formState[fieldName].validation.customError ||
                'Please provide a first name.',
            })
            // For RegEx matcher, see https://stackoverflow.com/questions/2385701/regular-expression-for-first-and-last-name (comma character omitted, since we're separating first and last name out)
          } else if (!field.value.match(/^[a-z]+[a-z .'-]*$/i)) {
            return dispatchErrorAction({
              type: 'UPDATE_ERROR',
              field: fieldName,
              error:
                formState[fieldName].validation.customError ||
                'Must start with an alpha character, and consist of alpha and " \' ", " . ", or " - " characters',
            })
          } else {
            return dispatchValid(fieldName)
          }
        }

        case 'lastName': {
          if (!field.value.length) {
            return dispatchErrorAction({
              type: 'UPDATE_ERROR',
              field: fieldName,
              error:
                formState[fieldName].validation.customError ||
                'Please provide a last name.',
            })
          } else if (!field.value.match(/^[a-z]+[a-z ,.'-]*$/i)) {
            return dispatchErrorAction({
              type: 'UPDATE_ERROR',
              field: fieldName,
              error:
                formState[fieldName].validation.customError ||
                'Must start with an alpha character, and consist of alpha and " \' ", " . ", " , ", or " - " characters',
            })
          } else {
            return dispatchValid(fieldName)
          }
        }

        default:
          return dispatchValid(fieldName)
      }
    })
  }, [formState])

  useEffect(validate, [formState, validate])

  const formInvalid = useMemo(() => {
    /* Any truthy strings in combination with a required field (default) indicates a validation error */
    return !!Object.keys(errorState).find(
      (key) => !!errorState[key] && !formState[key].validation.optional
    )
  }, [formState, errorState])

  return {
    loading,
    setLoading,
    didAttemptSubmit,
    setDidAttemptSubmit,
    formState,
    errorState,
    dispatchFormAction,

    globalFormError /* When an error stems from a network call, or doesn't have to do with just one field */,
    setGlobalFormError,
    formInvalid,
  }
}
