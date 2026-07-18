import { useState } from 'react'
import { User, Phone, Mail, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'

function App() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subscribe: false
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    const phoneRegex = /^[0-9]{10}$/
    if (!formData.phone) {
      newErrors.phone = 'Mobile number is required'
    } else if (!phoneRegex.test(formData.phone.replace(/[-\s]/g, ''))) {
      newErrors.phone = 'Enter a valid 10-digit mobile number'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email) {
      newErrors.email = 'Email address is required'
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Enter a valid email address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Clear error for the field being edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    setErrors({})

    try {
      const response = await fetch('http://localhost:5001/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        setIsSubmitted(true)
      } else {
        if (data.errors) {
          setErrors(data.errors)
        } else {
          setErrors({ form: data.message || 'Something went wrong. Please try again.' })
        }
      }
    } catch (error) {
      console.error('API Error:', error)
      setErrors({ form: 'Unable to connect to the registration server. Please make sure the backend is running.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      subscribe: false
    })
    setErrors({})
    setIsSubmitted(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans w-full">
      {/* Decorative gradient glowing spheres */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full filter blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full filter blur-[120px] pointer-events-none animate-pulse delay-1000"></div>

      <div className="w-full max-w-md relative z-10 transition-all duration-500">
        {!isSubmitted ? (
          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500"></div>

            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Join the Network
              </h1>
              <p className="text-slate-400 mt-2 text-sm">
                Register today and unlock full access to our platform.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-2.5 bg-slate-950/60 border rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 transition duration-200 ${
                      errors.name
                        ? 'border-rose-500/50 focus:ring-rose-500/30'
                        : 'border-slate-800 focus:ring-purple-500/30 focus:border-purple-500'
                    }`}
                    placeholder="John Doe"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1.5 flex items-center text-xs text-rose-400">
                    <AlertCircle className="w-3.5 h-3.5 mr-1" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Mobile Number Field */}
              <div>
                <label htmlFor="phone" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-2.5 bg-slate-950/60 border rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 transition duration-200 ${
                      errors.phone
                        ? 'border-rose-500/50 focus:ring-rose-500/30'
                        : 'border-slate-800 focus:ring-purple-500/30 focus:border-purple-500'
                    }`}
                    placeholder="9876543210"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1.5 flex items-center text-xs text-rose-400">
                    <AlertCircle className="w-3.5 h-3.5 mr-1" />
                    {errors.phone}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-2.5 bg-slate-950/60 border rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 transition duration-200 ${
                      errors.email
                        ? 'border-rose-500/50 focus:ring-rose-500/30'
                        : 'border-slate-800 focus:ring-purple-500/30 focus:border-purple-500'
                    }`}
                    placeholder="john@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 flex items-center text-xs text-rose-400">
                    <AlertCircle className="w-3.5 h-3.5 mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Subscribe Checkbox */}
              <div className="flex items-start pt-2">
                <div className="flex items-center h-5">
                  <input
                    id="subscribe"
                    name="subscribe"
                    type="checkbox"
                    checked={formData.subscribe}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-purple-600 focus:ring-purple-500/30 focus:ring-offset-slate-900 focus:outline-none cursor-pointer"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="subscribe" className="font-medium text-slate-300 cursor-pointer select-none">
                    Subscribe to newsletter
                  </label>
                  <p className="text-xs text-slate-500">Get weekly updates on tech trends and features.</p>
                </div>
              </div>

              {/* Form-level Error Message */}
              {errors.form && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errors.form}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center py-3 px-4 rounded-lg text-white font-medium bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 cursor-pointer shadow-lg hover:shadow-purple-500/10 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed group mt-2"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Registration...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    Register Now
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                  </span>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Success Screen */
          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl p-8 text-center relative overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-emerald-500"></div>

            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-400 mb-6 scale-up-center">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Registration Complete!</h2>
            <p className="text-slate-400 text-sm mb-6">
              Thank you for signing up. Your details have been successfully recorded.
            </p>

            <div className="bg-slate-950/80 border border-slate-850 rounded-xl p-4 mb-6 text-left space-y-3">
              <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Registered Details</div>
              <div className="grid grid-cols-3 gap-1 text-sm border-b border-slate-900 pb-2">
                <span className="text-slate-400">Name:</span>
                <span className="col-span-2 text-white font-medium truncate">{formData.name}</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-sm border-b border-slate-900 pb-2">
                <span className="text-slate-400">Mobile:</span>
                <span className="col-span-2 text-white font-medium">{formData.phone}</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-sm border-b border-slate-900 pb-2">
                <span className="text-slate-400">Email:</span>
                <span className="col-span-2 text-white font-medium truncate">{formData.email}</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-sm">
                <span className="text-slate-400">Newsletter:</span>
                <span className="col-span-2">
                  {formData.subscribe ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                      Subscribed
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                      Not Subscribed
                    </span>
                  )}
                </span>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium focus:outline-none transition duration-200 cursor-pointer"
            >
              Register Another Account
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
