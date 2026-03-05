export default function BrezCodeFeatures() {
  const activities = [
    { title: 'Daily 5mins breathing exercise', description: 'Lower Chronic stress', reduction: '-15%' },
    { title: 'Daily 10mins mindfulness exercise', description: 'Increase positivity', reduction: '-5%' },
    { title: '3x/weekly Self Breast Massage', description: 'Lower Chronic inflammation', reduction: '-20%' },
    { title: 'Personalized dietary management', description: 'Lower Carcinogen', reduction: '-20%' },
    { title: 'Daily Physical exercise tracking', description: 'Lower oxidative stress', reduction: '-40%' },
    { title: 'Monthly Self Breast Exam', description: 'Early Symptom Detection', reduction: '-20%' },
    { title: 'Daily educational content and tips', description: 'Increase awareness', reduction: '-5%' },
    { title: 'AI-Risk Monitoring system', description: 'Early detection', reduction: '-50%' },
  ]

  const riskData = [
    { name: 'Exercise', reduction: 40, icon: '\uD83D\uDCAA' },
    { name: 'Nutrition', reduction: 25, icon: '\uD83E\uDD57' },
    { name: 'Mindfulness', reduction: 20, icon: '\uD83E\uDDD8\u200D\u2640\uFE0F' },
    { name: 'Monitoring', reduction: 35, icon: '\uD83D\uDCCA' },
    { name: 'Breathing', reduction: 15, icon: '\uD83E\uDEC1' },
    { name: 'Massage', reduction: 20, icon: '\uD83D\uDC86\u200D\u2640\uFE0F' },
    { name: 'Self Exam', reduction: 20, icon: '\uD83D\uDD0D' },
  ]

  const total = riskData.reduce((sum, item) => sum + item.reduction, 0)

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-[1440px] mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Evidence-based activities to reverse breast cancer development
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            All activities are scientifically proven to reduce breast cancer risk
          </p>
        </div>

        {/* iPhone Mockup Risk Chart */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div
                className="shadow-2xl"
                style={{
                  height: '600px',
                  width: '20rem',
                  background: 'linear-gradient(180deg, #1f2937, #0b0f19)',
                  borderRadius: '3rem',
                  padding: '8px'
                }}
              >
                <div
                  className="w-full h-full overflow-hidden relative"
                  style={{ background: '#ffffff', borderRadius: '2.5rem' }}
                >
                  {/* Notch */}
                  <div
                    className="absolute bg-black rounded-b-2xl z-10"
                    style={{ top: 0, left: '50%', transform: 'translateX(-50%)', width: '8rem', height: '1.5rem' }}
                  />

                  {/* Status Bar */}
                  <div className="pt-8 px-6 flex justify-between items-center text-sm font-medium text-gray-900">
                    <span>9:41</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-2 border border-gray-900 rounded-lg">
                        <div className="w-full h-full bg-green-500 rounded-lg" />
                      </div>
                    </div>
                  </div>

                  {/* Chart Content */}
                  <div className="px-6 pt-4 h-full overflow-y-auto">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Risk Reduction Progress</h3>
                    </div>

                    <div className="space-y-4">
                      {riskData.map((item, index) => (
                        <div key={index} className="bg-gray-50 rounded-xl p-4" style={item.name === 'Self Exam' ? { marginBottom: '1rem' } : undefined}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{item.icon}</span>
                              <span className="text-base font-semibold text-gray-900">{item.name}</span>
                            </div>
                            <span className="text-lg font-bold text-blue-600">-{item.reduction}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full"
                              style={{ width: `${(item.reduction / 50) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Total Risk Reduction Display */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-6 rounded-2xl shadow-lg max-w-lg mx-auto mb-12">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">Achieve {total}% Risk Reduction</div>
              <div className="text-lg opacity-90">Through evidence-based lifestyle changes</div>
            </div>
          </div>
        </div>

        {/* Activity Cards Grid */}
        <div className="grid grid-cols-2 gap-4 justify-items-center">
          {activities.map((activity, index) => (
            <div key={index} className="bg-white border-2 border-blue-100 p-4 rounded-2xl hover:shadow-xl transition-shadow hover:border-blue-200 w-full">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-900 flex-1 pr-2">{activity.title}</h3>
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                  {activity.reduction}
                </div>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">{activity.description}</p>
            </div>
          ))}
        </div>

        {/* Benefits Summary */}
        <div className="mt-20 bg-gradient-to-r from-blue-50 to-blue-100 rounded-3xl p-12">
          <div className="grid md:grid-cols-2 gap-12 items-center justify-items-center">
            {/* Left side - Content */}
            <div className="text-center md:text-left">
              <h3 className="text-3xl font-bold mb-8 text-blue-600">BrezCode can help you</h3>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold mb-2 text-gray-900">Reduce breast cancer risk</h4>
                    <p className="text-gray-600">No matter where you are on your journey, BrezCode can help you reduce risk, with no pressure to be perfect.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold mb-2 text-gray-900">Gain control over your wellness</h4>
                    <p className="text-gray-600">We&apos;ll teach you the science-backed habits and techniques to gain control over your breast health.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold mb-2 text-gray-900">Reduce anxiety and stress</h4>
                    <p className="text-gray-600">The days of anxiety ruining your day or week are over. Learn to enjoy peace of mind with fewer negative effects.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold mb-2 text-gray-900">Improve your well-being</h4>
                    <p className="text-gray-600">Taking care of your health can have a big positive impact on your sleep, mental health, relationships, and more.</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <a
                  href="#pricing"
                  className="inline-block bg-yellow-400 text-black px-8 py-3 rounded-full text-lg font-bold hover:bg-yellow-300 transition-all"
                >
                  Take the quiz to start
                </a>
              </div>
            </div>

            {/* Right side - Image */}
            <div className="relative flex justify-center">
              <div className="bg-white rounded-3xl p-8 shadow-lg">
                <div className="w-full h-96 rounded-2xl overflow-hidden flex items-center justify-center">
                  <img
                    src="/yoga-lady.png"
                    alt="Woman meditating in peaceful pose"
                    className="w-full h-full object-cover rounded-2xl"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
