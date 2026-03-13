export function cn(...inputs) {
  const classes = []

  const append = (value) => {
    if (!value) {
      return
    }

    if (typeof value === 'string') {
      classes.push(value)
      return
    }

    if (Array.isArray(value)) {
      value.forEach(append)
      return
    }

    if (typeof value === 'object') {
      Object.entries(value).forEach(([key, enabled]) => {
        if (enabled) {
          classes.push(key)
        }
      })
    }
  }

  inputs.forEach(append)
  return classes.join(' ')
}
