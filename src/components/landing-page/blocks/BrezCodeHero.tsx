export default function BrezCodeHero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)'
      }}
    >
      <div className="max-w-[1440px] mx-auto px-4">
        {/* Top Content Area */}
        <div className="text-center mb-16 pt-20">
          {/* Badge Pill */}
          <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-3xl px-6 py-3 mb-8">
            <div
              className="w-3 h-3 bg-green-400 rounded-full mr-3"
              style={{ animation: 'pulse 2s infinite' }}
            />
            <span className="text-white text-sm font-medium">
              Evidence-based AI coaching available 24/7
            </span>
          </div>

          {/* WHO Quote */}
          <p className="text-xl text-white/90 max-w-4xl mx-auto mb-6 leading-relaxed">
            &ldquo;1 in 8 women in US will develop breast cancer in their lifetime&rdquo;... According to WHO
          </p>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-5xl font-bold text-white max-w-4xl mx-auto mb-6 leading-tight">
            Good news! You can now{' '}
            <span
              style={{
                background: 'linear-gradient(45deg, #facc15, #f59e0b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              REVERSE
            </span>{' '}
            the development
            <br />
            and lower the risk by{' '}
            <span style={{ color: '#facc15' }}>100% in 15 days.</span>
          </h1>

          {/* Italic Subheadline */}
          <p className="text-xl text-white/90 max-w-4xl mx-auto mb-2 leading-relaxed italic">
            The #1 evidence-based AI breast health coaching platform to help you
          </p>
          <p className="text-xl text-white/90 max-w-4xl mx-auto mb-8 leading-relaxed italic">
            regain control of your wellness.
          </p>

          {/* Don't wait text */}
          <p className="text-lg text-white/90 max-w-3xl mx-auto mb-12 leading-relaxed">
            Don&apos;t wait until it is too late, your family depends on you.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-6 items-center mb-8">
            <a
              href="#pricing"
              className="inline-block bg-yellow-400 text-black px-12 py-5 text-xl font-bold rounded-3xl hover:bg-yellow-300 transition-colors"
              style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
            >
              Take the quiz to start
            </a>
            <a
              href="#"
              className="inline-block border-2 border-white text-white bg-transparent px-8 py-4 text-base font-bold rounded-3xl hover:bg-white/10 transition-colors"
            >
              Already have an account? Sign In
            </a>
          </div>

          <p className="text-white/80 text-lg mb-16">
            Start for free. Cancel any time.
          </p>
        </div>

        {/* Hero Image Section - Two Column */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start pb-8">
          {/* Left Column - Woman with Yellow Circle and Chat Bubbles */}
          <div className="relative flex justify-center items-end" style={{ height: '500px' }}>
            {/* Yellow Circle Background */}
            <div
              className="absolute rounded-full"
              style={{
                width: '320px',
                height: '320px',
                backgroundColor: '#facc15',
                bottom: '120px'
              }}
            />
            {/* Woman Image */}
            <img
              src="/happy-woman.png"
              alt="Happy woman using phone"
              className="relative z-10"
              style={{
                objectFit: 'contain',
                objectPosition: 'bottom',
                width: '24rem',
                height: '30rem',
                filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
              }}
            />

            {/* Chat Bubble 1 - Top Right */}
            <div
              className="absolute z-20 bg-white rounded-2xl p-3 max-w-[192px]"
              style={{
                top: '16px',
                right: '16px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            >
              <p className="text-sm text-gray-700 m-0">Hey Sue, how&apos;d it go yesterday?</p>
            </div>

            {/* Chat Bubble 2 - Purple */}
            <div
              className="absolute z-20 rounded-2xl p-3 max-w-[192px]"
              style={{
                top: '80px',
                right: '32px',
                backgroundColor: '#8b5cf6',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            >
              <p className="text-sm text-white m-0">I am following the plan, and feeling great today!</p>
            </div>

            {/* Chat Bubble 3 - Green */}
            <div
              className="absolute z-20 rounded-2xl p-3 max-w-[160px]"
              style={{
                bottom: '80px',
                left: '16px',
                backgroundColor: '#10b981',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            >
              <p className="text-sm text-white m-0">Great work sticking to your plan!</p>
            </div>
          </div>

          {/* Right Column - 96% Stat */}
          <div className="text-left">
            <div className="text-[96px] font-bold text-white leading-none mb-4">96%</div>
            <div className="text-3xl font-bold text-white mb-4 leading-snug">
              of members report<br />
              reduced anxiety after 90 days
            </div>
            <p className="text-blue-100 mb-8 text-base leading-relaxed">
              In addition, BrezCode members feel accomplished by an average of 80% after 90 days, as verified in a third-party study.
            </p>

            <div className="flex flex-col gap-4">
              <a
                href="#pricing"
                className="inline-block bg-yellow-400 text-black px-8 py-4 text-lg font-bold rounded-3xl hover:bg-yellow-300 transition-colors border-none w-fit"
              >
                Take the quiz to start
              </a>
              <div className="h-14" />
            </div>
          </div>
        </div>
      </div>

      {/* Pulse animation keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}} />
    </section>
  )
}
