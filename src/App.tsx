import { useState, useEffect, useRef } from 'react'
import { Copy, RefreshCw, Loader2, Settings, ChevronDown } from 'lucide-react'

type Tone = 'Professional' | 'Semi-professional' | 'Friendly' | 'Funny'

interface FillerText {
  sentence: string
  short_paragraph: string
  long_paragraph: string
}

const API_KEY_STORAGE = 'gemini_api_key'

interface LanguageOption {
  code: string
  englishName: string
  nativeName: string
}

const EUROPEAN_LANGUAGES: LanguageOption[] = [
  { code: 'en', englishName: 'English', nativeName: 'English' },
  { code: 'cs', englishName: 'Czech', nativeName: 'čeština' },
  { code: 'sk', englishName: 'Slovak', nativeName: 'slovenčina' },
  { code: 'pl', englishName: 'Polish', nativeName: 'polski' },
  { code: 'de', englishName: 'German', nativeName: 'Deutsch' },
  { code: 'fr', englishName: 'French', nativeName: 'français' },
  { code: 'es', englishName: 'Spanish', nativeName: 'español' },
  { code: 'it', englishName: 'Italian', nativeName: 'italiano' },
  { code: 'pt', englishName: 'Portuguese', nativeName: 'português' },
  { code: 'nl', englishName: 'Dutch', nativeName: 'Nederlands' },
  { code: 'ru', englishName: 'Russian', nativeName: 'русский' },
  { code: 'uk', englishName: 'Ukrainian', nativeName: 'українська' },
  { code: 'bg', englishName: 'Bulgarian', nativeName: 'български' },
  { code: 'hr', englishName: 'Croatian', nativeName: 'hrvatski' },
  { code: 'sr', englishName: 'Serbian', nativeName: 'српски' },
  { code: 'sl', englishName: 'Slovenian', nativeName: 'slovenščina' },
  { code: 'hu', englishName: 'Hungarian', nativeName: 'magyar' },
  { code: 'ro', englishName: 'Romanian', nativeName: 'română' },
  { code: 'el', englishName: 'Greek', nativeName: 'ελληνικά' },
  { code: 'fi', englishName: 'Finnish', nativeName: 'suomi' },
  { code: 'sv', englishName: 'Swedish', nativeName: 'svenska' },
  { code: 'da', englishName: 'Danish', nativeName: 'dansk' },
  { code: 'no', englishName: 'Norwegian', nativeName: 'norsk' },
  { code: 'is', englishName: 'Icelandic', nativeName: 'íslenska' },
  { code: 'ga', englishName: 'Irish', nativeName: 'Gaeilge' },
  { code: 'mt', englishName: 'Maltese', nativeName: 'Malti' },
  { code: 'lv', englishName: 'Latvian', nativeName: 'latviešu' },
  { code: 'lt', englishName: 'Lithuanian', nativeName: 'lietuvių' },
  { code: 'et', englishName: 'Estonian', nativeName: 'eesti' },
  { code: 'ca', englishName: 'Catalan', nativeName: 'català' },
  { code: 'eu', englishName: 'Basque', nativeName: 'euskara' },
  { code: 'cy', englishName: 'Welsh', nativeName: 'Cymraeg' },
  { code: 'br', englishName: 'Breton', nativeName: 'brezhoneg' },
]

function App() {
  const [subject, setSubject] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>(EUROPEAN_LANGUAGES[0]) // English
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false)
  const [languageSearchQuery, setLanguageSearchQuery] = useState('')
  const [tone, setTone] = useState<Tone>('Professional')
  const [loading, setLoading] = useState(false)
  const [fillerText, setFillerText] = useState<FillerText | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [apiKey, setApiKey] = useState<string>('')
  const [tempApiKey, setTempApiKey] = useState<string>('')
  const [copiedCard, setCopiedCard] = useState<'sentence' | 'short' | 'long' | null>(null)
  const languageDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check for API key in env or localStorage
    const envKey = import.meta.env.VITE_GEMINI_API_KEY
    const storedKey = localStorage.getItem(API_KEY_STORAGE)
    
    if (envKey) {
      setApiKey(envKey)
    } else if (storedKey) {
      setApiKey(storedKey)
    } else {
      setShowSettings(true)
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setLanguageDropdownOpen(false)
        setLanguageSearchQuery('')
      }
    }

    if (languageDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [languageDropdownOpen])

  const getApiKey = (): string => {
    const envKey = import.meta.env.VITE_GEMINI_API_KEY
    if (envKey) return envKey
    
    const storedKey = localStorage.getItem(API_KEY_STORAGE)
    if (storedKey) return storedKey
    
    return apiKey
  }

  const saveApiKey = () => {
    if (tempApiKey.trim()) {
      localStorage.setItem(API_KEY_STORAGE, tempApiKey.trim())
      setApiKey(tempApiKey.trim())
      setTempApiKey('')
      setShowSettings(false)
    }
  }

  const generateFillerText = async () => {
    if (!subject.trim()) {
      setError('Please enter a subject')
      return
    }

    const key = getApiKey()
    if (!key) {
      setError('API key is required. Please configure it in settings.')
      setShowSettings(true)
      return
    }

    setLoading(true)
    setError(null)

    const langName = `${selectedLanguage.englishName} (${selectedLanguage.nativeName})`
    const prompt = `Write 3 variations of filler text about the topic: '${subject}'.
Language: ${langName}.
Tone: ${tone}.
1. A single sentence/headline.
2. A short paragraph (2-3 lines).
3. A longer paragraph (6 lines).
Return strictly JSON: { "sentence": "...", "short_paragraph": "...", "long_paragraph": "..." }`

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to generate text')
      }

      const data = await response.json()
      const text = data.candidates[0]?.content?.parts[0]?.text || ''

      // Try to extract JSON from the response
      let jsonText = text.trim()
      
      // Remove markdown code blocks if present
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '')
      }

      const parsed: FillerText = JSON.parse(jsonText)
      setFillerText(parsed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error generating filler text:', err)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, cardType: 'sentence' | 'short' | 'long') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCard(cardType)
      setTimeout(() => {
        setCopiedCard(null)
      }, 2000) // Hide after 2 seconds
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const resetForm = () => {
    setFillerText(null)
    setError(null)
    setSubject('')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">ContextFiller</h1>
              <p className="text-slate-400 mt-1">Context-aware placeholder text generator</p>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-slate-400 hover:text-white transition-colors"
              aria-label="Settings"
            >
              <Settings size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column - Controls */}
          <div className="md:col-span-1">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 sticky top-8">
              <div className="space-y-6">
                {/* Subject Input - More Prominent */}
                <div>
                  <label htmlFor="subject" className="block text-base font-semibold text-white mb-3">
                    Subject
                  </label>
                  <input
                    id="subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Organic Skincare..."
                    className="w-full px-5 py-4 text-lg bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

            {/* Language Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Language
              </label>
              <div className="relative" ref={languageDropdownRef}>
                <button
                  onClick={() => {
                    setLanguageDropdownOpen(!languageDropdownOpen)
                    setLanguageSearchQuery('')
                  }}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white flex items-center justify-between hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <span>
                    {selectedLanguage.englishName} / {selectedLanguage.nativeName} ({selectedLanguage.code.toUpperCase()})
                  </span>
                  <ChevronDown 
                    size={20} 
                    className={`text-slate-400 transition-transform ${languageDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                
                {languageDropdownOpen && (
                  <div className="absolute z-10 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-80 overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-slate-700">
                      <input
                        type="text"
                        value={languageSearchQuery}
                        onChange={(e) => setLanguageSearchQuery(e.target.value)}
                        placeholder="Search language..."
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                        autoFocus
                      />
                    </div>
                    <div className="overflow-y-auto max-h-64">
                      {EUROPEAN_LANGUAGES
                        .filter((lang) => {
                          const query = languageSearchQuery.toLowerCase()
                          return (
                            lang.englishName.toLowerCase().includes(query) ||
                            lang.nativeName.toLowerCase().includes(query) ||
                            lang.code.toLowerCase().includes(query)
                          )
                        })
                        .map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => {
                              setSelectedLanguage(lang)
                              setLanguageDropdownOpen(false)
                              setLanguageSearchQuery('')
                            }}
                            className={`w-full text-left px-4 py-2 hover:bg-slate-700 transition-colors ${
                              selectedLanguage.code === lang.code
                                ? 'bg-indigo-600/20 text-indigo-400'
                                : 'text-slate-300'
                            }`}
                          >
                            <div className="text-sm">
                              {lang.englishName} / {lang.nativeName} ({lang.code.toUpperCase()})
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

                {/* Tone Selector */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Tone
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Professional', 'Semi-professional', 'Friendly', 'Funny'] as Tone[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTone(t)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                          tone === t
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={generateFillerText}
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={20} />
                      Generate Filler Text
                    </>
                  )}
                </button>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-900/20 border border-red-800 text-red-300 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Output */}
          <div className="md:col-span-2">
            {fillerText ? (
              <div className="space-y-6">
                {/* Sentence Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 relative">
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={() => copyToClipboard(fillerText.sentence, 'sentence')}
                      className="p-2 text-slate-400 hover:text-white transition-colors relative"
                      aria-label="Copy sentence"
                    >
                      <Copy size={18} />
                      {copiedCard === 'sentence' && (
                        <div className="absolute top-full right-0 mt-2 px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded whitespace-nowrap animate-fadeIn">
                          Copied to clipboard!
                        </div>
                      )}
                    </button>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3">Sentence</h3>
                  <p className="text-slate-300 leading-relaxed">{fillerText.sentence}</p>
                </div>

                {/* Short Paragraph Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 relative">
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={() => copyToClipboard(fillerText.short_paragraph, 'short')}
                      className="p-2 text-slate-400 hover:text-white transition-colors relative"
                      aria-label="Copy short paragraph"
                    >
                      <Copy size={18} />
                      {copiedCard === 'short' && (
                        <div className="absolute top-full right-0 mt-2 px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded whitespace-nowrap animate-fadeIn">
                          Copied to clipboard!
                        </div>
                      )}
                    </button>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3">Short Paragraph</h3>
                  <p className="text-slate-300 leading-relaxed">{fillerText.short_paragraph}</p>
                </div>

                {/* Long Paragraph Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 relative">
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={() => copyToClipboard(fillerText.long_paragraph, 'long')}
                      className="p-2 text-slate-400 hover:text-white transition-colors relative"
                      aria-label="Copy long paragraph"
                    >
                      <Copy size={18} />
                      {copiedCard === 'long' && (
                        <div className="absolute top-full right-0 mt-2 px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded whitespace-nowrap animate-fadeIn">
                          Copied to clipboard!
                        </div>
                      )}
                    </button>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3">Long Paragraph</h3>
                  <p className="text-slate-300 leading-relaxed">{fillerText.long_paragraph}</p>
                </div>

                {/* Reset Button */}
                <div className="flex justify-end">
                  <button
                    onClick={resetForm}
                    className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center">
                <p className="text-slate-500">Generated filler text will appear here</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-4">Settings</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="api-key" className="block text-sm font-medium text-slate-300 mb-2">
                  Gemini API Key
                </label>
                <input
                  id="api-key"
                  type="password"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  placeholder="Enter your API key"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Your API key will be stored locally in your browser.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={saveApiKey}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowSettings(false)
                    setTempApiKey('')
                  }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default App
