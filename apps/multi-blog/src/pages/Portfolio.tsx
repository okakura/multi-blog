import {
  ChevronDown,
  Code,
  ExternalLink,
  Github,
  Linkedin,
  Mail,
  Menu,
  Rocket,
  X,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'

const DeveloperPortfolio = () => {
  const [activeSection, setActiveSection] = useState('home')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const projects = [
    {
      title: 'Multi-Blog Platform',
      tech: 'Rust, Axum, PostgreSQL, React, SWR',
      description:
        'Multi-tenant blog platform with domain-based routing and real-time data caching',
      color: 'from-purple-500 to-pink-500',
      link: '/blog/tech.blog',
    },
    {
      title: 'AI-Powered Analytics Dashboard',
      tech: 'React, TypeScript, D3.js',
      description:
        'Real-time data visualization platform with machine learning insights',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Blockchain Trading Platform',
      tech: 'Next.js, Web3, Solidity',
      description:
        'Decentralized trading interface with smart contract integration',
      color: 'from-green-500 to-teal-500',
    },
    {
      title: 'Neural Network Visualizer',
      tech: 'Three.js, Python, TensorFlow',
      description: 'Interactive 3D visualization of deep learning models',
      color: 'from-orange-500 to-red-500',
    },
  ]

  const skills = [
    { name: 'JavaScript/TypeScript', level: 95, color: 'bg-yellow-400' },
    { name: 'React/Next.js', level: 92, color: 'bg-blue-400' },
    { name: 'Node.js/Python', level: 88, color: 'bg-green-400' },
    { name: 'Three.js/WebGL', level: 85, color: 'bg-purple-400' },
    { name: 'AWS/Docker', level: 82, color: 'bg-orange-400' },
    { name: 'Machine Learning', level: 78, color: 'bg-pink-400' },
  ]

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId)
    setIsMenuOpen(false)
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-30">
        <div
          className="absolute w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-20"
          style={{
            left: mousePos.x / 10,
            top: mousePos.y / 10,
            transform: 'translate(-50%, -50%)',
          }}
        />
        <div
          className="absolute w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20"
          style={{
            right: mousePos.x / 15,
            bottom: mousePos.y / 15,
            transform: 'translate(50%, 50%)',
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-lg bg-white/5 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              &lt;DevName /&gt;
            </div>

            <div className="hidden md:block">
              <div className="flex space-x-8">
                {['Home', 'About', 'Projects', 'Blog', 'Admin', 'Contact'].map(
                  (item) => (
                    <button
                      key={item}
                      onClick={() => {
                        if (item === 'Blog') {
                          window.location.href = '/blog/tech.blog'
                        } else if (item === 'Admin') {
                          window.location.href = '/admin'
                        } else {
                          scrollToSection(item.toLowerCase())
                        }
                      }}
                      className={`px-3 py-2 text-sm font-medium transition-all duration-300 hover:text-purple-400 ${
                        activeSection === item.toLowerCase()
                          ? 'text-purple-400 border-b-2 border-purple-400'
                          : 'text-gray-300'
                      }`}
                    >
                      {item}
                    </button>
                  ),
                )}
              </div>
            </div>

            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-black/50 backdrop-blur-lg">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {['Home', 'About', 'Projects', 'Blog', 'Admin', 'Contact'].map(
                (item) => (
                  <button
                    key={item}
                    onClick={() => {
                      if (item === 'Blog') {
                        window.location.href = '/blog/tech.blog'
                      } else if (item === 'Admin') {
                        window.location.href = '/admin'
                      } else {
                        scrollToSection(item.toLowerCase())
                      }
                    }}
                    className="block px-3 py-2 text-base font-medium text-gray-300 hover:text-purple-400 w-full text-left"
                  >
                    {item}
                  </button>
                ),
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section
        id="home"
        className="min-h-screen flex items-center justify-center relative pt-16"
      >
        <div className="text-center z-10 max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-6xl md:text-8xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-pulse">
              Name Surname
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              Full-Stack Developer & AI Enthusiast
            </p>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Crafting innovative digital experiences with cutting-edge
              technology. Passionate about AI, blockchain, and creating
              beautiful user interfaces.
            </p>
          </div>

          <div className="flex justify-center space-x-6 mb-12">
            <a
              href="#"
              className="p-3 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all duration-300 hover:scale-110"
            >
              <Github size={24} />
            </a>
            <a
              href="#"
              className="p-3 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all duration-300 hover:scale-110"
            >
              <Linkedin size={24} />
            </a>
            <a
              href="#"
              className="p-3 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all duration-300 hover:scale-110"
            >
              <Mail size={24} />
            </a>
          </div>

          <button
            onClick={() => scrollToSection('about')}
            className="group bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-4 rounded-full font-semibold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
          >
            Explore My Work
            <ChevronDown
              className="inline ml-2 group-hover:translate-y-1 transition-transform"
              size={20}
            />
          </button>
        </div>

        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown size={32} className="text-purple-400" />
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 relative z-10">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            About Me
          </h2>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <p className="text-lg text-gray-300 leading-relaxed">
                I'm a passionate full-stack developer with 5+ years of
                experience building scalable web applications and exploring the
                frontiers of AI technology.
              </p>
              <p className="text-lg text-gray-300 leading-relaxed">
                My journey started with curiosity about how things work, evolved
                into creating digital solutions, and now focuses on pushing the
                boundaries of what's possible with modern web technologies.
              </p>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2 text-purple-400">
                  <Code size={20} />
                  <span>Clean Code</span>
                </div>
                <div className="flex items-center space-x-2 text-pink-400">
                  <Rocket size={20} />
                  <span>Innovation</span>
                </div>
                <div className="flex items-center space-x-2 text-blue-400">
                  <Zap size={20} />
                  <span>Performance</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {skills.map((skill, index) => (
                <div key={skill.name} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300 font-medium">
                      {skill.name}
                    </span>
                    <span className="text-gray-400">{skill.level}%</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        skill.color
                      } rounded-full transition-all duration-1000 delay-${
                        index * 100
                      }`}
                      style={{ width: `${skill.level}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 relative z-10">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Featured Projects
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <div
                key={project.title}
                className="group relative bg-white/5 backdrop-blur-sm rounded-xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 border border-white/10"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${project.color} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300`}
                />

                <div className="relative z-10">
                  <h3 className="text-xl font-bold mb-3 text-white group-hover:text-purple-300 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-sm text-purple-400 mb-3 font-medium">
                    {project.tech}
                  </p>
                  <p className="text-gray-300 mb-4 leading-relaxed">
                    {project.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() =>
                        project.link
                          ? (window.location.href = project.link)
                          : null
                      }
                      className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      <span>{project.link ? 'View Live' : 'View Project'}</span>
                      <ExternalLink size={16} />
                    </button>
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                      <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse delay-100" />
                      <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse delay-200" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 relative z-10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Let's Build Something Amazing
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Ready to turn your ideas into reality? I'm always excited to
            collaborate on innovative projects and explore new technologies.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-4 rounded-full font-semibold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/25">
              Start a Conversation
            </button>
            <button className="border-2 border-purple-400 px-8 py-4 rounded-full font-semibold hover:bg-purple-400 hover:text-black transition-all duration-300">
              Download Resume
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/10 text-center text-gray-400 relative z-10">
        <p>&copy; 2025 Josh Gautier. Crafted with React & Tailwind CSS</p>
      </footer>
    </div>
  )
}

export default DeveloperPortfolio
