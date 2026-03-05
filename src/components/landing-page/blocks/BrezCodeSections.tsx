// How BrezCode Works - 6 feature cards with icons
export function BrezCodeHowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="max-w-[1440px] mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
              <span className="text-white font-bold text-lg">BC</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">
              How <span className="text-blue-600">BrezCode Works</span>
            </h2>
          </div>
          <p className="text-lg text-gray-600 max-w-4xl mx-auto">
            After a quick quiz, we&apos;ll personalize your first weekly plan, introduce you to daily health rituals, and invite you to our private community. Our supportive coaches will be with you at every step of the way.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
          {/* Weekly planning */}
          <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow w-full max-w-sm">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-3">Weekly planning</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Every Sunday you&apos;ll get a personalized plan for the week ahead. Pre-commit to your week ahead to crush your goals.
                </p>
              </div>
            </div>
          </div>

          {/* Community */}
          <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow w-full max-w-sm">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-3">Community</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Give and get support in the vibrant BrezCode community, a place to cultivate a positive mindset every day.
                </p>
              </div>
            </div>
          </div>

          {/* Resources */}
          <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow w-full max-w-sm">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-3">Resources</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Exercises, videos, and resources are available on-demand to help you stay motivated when you need it.
                </p>
              </div>
            </div>
          </div>

          {/* 24/7 Coaching */}
          <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow w-full max-w-sm">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-3">24/7 Coaching</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  If you want any support or query, our AI coach trained by medical experts is always just a text message away, 24x7.
                </p>
              </div>
            </div>
          </div>

          {/* Progress Tracking */}
          <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow w-full max-w-sm">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-3">Progress Tracking</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Whether it&apos;s sleep, exercise, stress, or drinks cut, BrezCode shows you your progress in the terms that matter most to you.
                </p>
              </div>
            </div>
          </div>

          {/* Smart Alerts */}
          <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow w-full max-w-sm">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-3">Smart Alerts</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Tracking your drinks and diets will become the foundation of your habit change. BrezCode makes it simple and fun!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Testimonials
export function BrezCodeTestimonials() {
  const testimonials = [
    {
      name: 'Mia',
      initial: 'M',
      color: 'bg-blue-500',
      info: 'Age 26, College Student',
      quote: 'As a young woman, I ignored breast health. This app\'s fun, quick lessons taught me to listen to my body and act early!',
    },
    {
      name: 'Emily',
      initial: 'E',
      color: 'bg-green-500',
      info: 'Age 31, Working Mother',
      quote: 'I found a lump and panicked. The app guided me through self-exams and screening info, helping me stay calm and get answers fast.',
    },
    {
      name: 'Aisha',
      initial: 'A',
      color: 'bg-purple-500',
      info: 'Age 35, High-Risk Patient',
      quote: 'My sister had breast cancer, so I\'m high-risk. The app\'s risk scoring and check-in reminders help me feel in control of my health!',
    },
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-[1440px] mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Real BrezCode customers
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl shadow-xl">
              <div className="flex items-center mb-6">
                <div className={`w-16 h-16 ${t.color} rounded-full flex items-center justify-center text-white font-bold text-xl mr-4`}>
                  {t.initial}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{t.name}</h3>
                  <p className="text-gray-600">{t.info}</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center justify-between">
                <div className="flex text-yellow-400 text-lg">
                  {'★★★★★'}
                </div>
                <span className="text-sm text-gray-500">Real BrezCode Customer</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// FAQ
export function BrezCodeFAQ() {
  const faqs = [
    {
      q: 'Is my health information secure?',
      a: 'Yes, we use bank-level encryption and are HIPAA compliant. Your health data is never shared with third parties.',
    },
    {
      q: 'How accurate are the risk assessments?',
      a: 'Our assessments are based on evidence-based medical research and validated risk models used by healthcare professionals.',
    },
    {
      q: 'Can I cancel my subscription anytime?',
      a: 'Yes, you can cancel your subscription at any time. There are no long-term commitments or cancellation fees.',
    },
    {
      q: 'Is this a replacement for medical care?',
      a: 'No, BrezCode is designed to complement your healthcare, not replace it. Always consult with healthcare professionals for medical decisions.',
    },
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-[1440px] mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Frequently Asked <span className="text-blue-500">Questions</span>
          </h2>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-3">{faq.q}</h3>
              <p className="text-gray-600">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Promise section
export function BrezCodePromise() {
  return (
    <section className="py-20 bg-gradient-to-br from-purple-600 to-indigo-700">
      <div className="max-w-[1440px] mx-auto px-4">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
            Our Promise to You
          </h2>
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-12 max-w-4xl mx-auto">
            <p className="text-xl md:text-2xl text-white leading-relaxed font-medium mb-12">
              We know this is a deeply personal journey for you, as it was for us. We follow a strict code of conduct and promise to always put your health and wellness above all else.
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-white">
                <h3 className="text-xl font-bold mb-3">No shame or guilt ever</h3>
                <p className="text-white/90">
                  Mindful lifestyle is about celebrating our wins, not making you feel bad.
                </p>
              </div>

              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-white">
                <h3 className="text-xl font-bold mb-3">Always private and secure</h3>
                <p className="text-white/90">
                  This is a personal, private journey for you. We make privacy a top priority.
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-white">
                <h3 className="text-xl font-bold mb-3">Money back guarantee</h3>
                <p className="text-white/90">
                  If you give it a fair shot and aren&apos;t happy after 30 days, just let us know!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Results section
export function BrezCodeResults() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-[1440px] mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            With measurable impact
          </h2>
          <p className="text-lg text-gray-500 italic">
            Results reported from a recent customer survey
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <div className="space-y-4">
            <div className="flex items-center text-lg text-gray-800">
              <span className="w-2 h-2 bg-gray-800 rounded-full mr-3" />
              <span className="font-medium">96% feel less anxiety</span>
            </div>
            <div className="flex items-center text-lg text-gray-800">
              <span className="w-2 h-2 bg-gray-800 rounded-full mr-3" />
              <span className="font-medium">90% improve diet quality</span>
            </div>
            <div className="flex items-center text-lg text-gray-800">
              <span className="w-2 h-2 bg-gray-800 rounded-full mr-3" />
              <span className="font-medium">87% have better sleep</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center text-lg text-gray-800">
              <span className="w-2 h-2 bg-gray-800 rounded-full mr-3" />
              <span className="font-medium">80% feel accomplished</span>
            </div>
            <div className="flex items-center text-lg text-gray-800">
              <span className="w-2 h-2 bg-gray-800 rounded-full mr-3" />
              <span className="font-medium">75% improve mental health</span>
            </div>
            <div className="flex items-center text-lg text-gray-800">
              <span className="w-2 h-2 bg-gray-800 rounded-full mr-3" />
              <span className="font-medium">100% improve breast health</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Sign Up CTA
export function BrezCodeSignUp() {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-400 to-blue-600">
      <div className="max-w-[1440px] mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Start Your Journey Today
          </h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Join thousands of women taking control of their breast health with personalized AI guidance and support.
          </p>
        </div>

        <div className="flex justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full">
            <div className="space-y-4">
              <a
                href="#pricing"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-3 px-6 rounded-lg text-center transition-all font-medium"
              >
                Start Your Health Assessment
              </a>
              <p className="text-center text-sm text-gray-500 mb-4">
                Complete our 23-question assessment to get personalized insights
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Pricing section
export function BrezCodePricing() {
  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="max-w-[1440px] mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Free 15-day trial, then <span className="text-blue-500">simple pricing</span>
          </h2>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-4">
            <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-full text-lg font-bold inline-block">
              ★ BEST VALUE
            </span>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-3xl shadow-xl p-12 border-2 border-blue-500">
            <div className="text-center">
              <h3 className="text-3xl font-bold mb-4">BrezCode Premium</h3>
              <div className="text-6xl font-bold mb-2 text-blue-500">
                Free
              </div>
              <p className="text-xl text-gray-600 mb-2">15 days, then $4.99/month</p>
              <p className="text-gray-500 mb-8">Cancel anytime &bull; No hidden fees</p>

              <div className="grid md:grid-cols-2 gap-6 mb-8 text-left">
                <div className="space-y-3">
                  {['Easy Risk scoring and tracking', 'Weekly Planning', 'Analytics & dashboard', 'Personalized recommendations'].map((item, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  {['AI chatbot messaging interface', 'Supportive community', 'Focus on moderation', 'Affordable cost'].map((item, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <a
                href="#"
                className="block w-full py-4 rounded-full font-bold text-xl bg-yellow-400 text-black hover:bg-yellow-300 hover:shadow-lg transition-all text-center"
              >
                Take the quiz to start
              </a>

              <p className="text-sm text-gray-500 mt-4">
                Start immediately &bull; No credit card required &bull; Cancel anytime
              </p>
            </div>
          </div>
        </div>

        {/* Money Back Guarantee */}
        <div className="text-center mt-12">
          <p className="text-gray-600">
            <span className="font-semibold">30-day money-back guarantee</span> &bull; Cancel anytime &bull; No hidden fees
          </p>
        </div>
      </div>
    </section>
  )
}
