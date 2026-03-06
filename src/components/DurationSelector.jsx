import PropTypes from 'prop-types'

const DEFAULT_OPTIONS = [5, 10, 15, 20, 25]

function DurationSelector({ value, onChange, disabled = false, options = DEFAULT_OPTIONS, className = '' }) {
  return (
    <div className={className}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Lesson Duration</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            disabled={disabled}
            onClick={() => onChange?.(option)}
            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
              value === option
                ? 'border-sky-300 bg-sky-50 text-sky-700'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {option} min
          </button>
        ))}
      </div>
    </div>
  )
}

DurationSelector.propTypes = {
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  options: PropTypes.arrayOf(PropTypes.number),
  className: PropTypes.string,
}

export default DurationSelector

