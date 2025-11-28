"use client"

const features = [
  {
    emoji: "🧠",
    title: "Smart & Helpful",
    description: "Answers your questions with patience and care. Always ready to explain things in a way that makes sense.",
    color: "bg-blue-50",
  },
  {
    emoji: "🎙️",
    title: "Speak & Listen",
    description: "Use your voice to chat naturally. Just talk, and Robot Friend will listen and respond out loud!",
    color: "bg-purple-50",
  },
  {
    emoji: "🛡️",
    title: "Safe & Secure",
    description: "Your conversations are private and protected. Designed with kids' safety as the top priority.",
    color: "bg-green-50",
  },
  {
    emoji: "😊",
    title: "Always Kind",
    description: "No judgment, just genuine support. Robot Friend celebrates your questions and curiosity.",
    color: "bg-yellow-50",
  },
  {
    emoji: "🎮",
    title: "Fun & Engaging",
    description: "Learning doesn't have to be boring! Play games, tell stories, and explore together.",
    color: "bg-pink-50",
  },
  {
    emoji: "⚡",
    title: "Always There",
    description: "Chat anytime, anywhere. Robot Friend is always ready to help whenever you need it.",
    color: "bg-orange-50",
  },
]

export function FeaturesGrid() {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-800 mb-4">
            Why Kids Love Robot Friend
          </h2>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
            A cheerful companion designed to make learning fun and conversations magical.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-card group cursor-pointer"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Colored background accent */}
              <div className={`absolute inset-0 ${feature.color} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10`} />

              {/* Emoji */}
              <span className="emoji">{feature.emoji}</span>

              {/* Title */}
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
