export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
      
      <div className="prose prose-gray max-w-none">
        <p className="text-gray-600 mb-6">Last updated: January 2025</p>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Our system processes publicly available information from RSS feeds, news sources, 
            and other public data sources related to discrimination incidents. We do not 
            collect personal information from users beyond basic system logs.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Information</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Information is used solely for the purpose of monitoring, analyzing, and reporting 
            on discrimination trends. This includes:
          </p>
          <ul className="list-disc ml-6 text-gray-700 mb-4">
            <li>Categorizing and classifying discrimination incidents</li>
            <li>Generating analytics and trend reports</li>
            <li>Improving content classification accuracy</li>
            <li>Providing educational resources</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Data Security</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            We implement appropriate security measures to protect the information processed 
            by our systems. All data is handled in accordance with industry best practices 
            for data security and privacy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Third-Party Sources</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Our system aggregates information from public RSS feeds and news sources. 
            We are not responsible for the privacy practices of these third-party sources.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Contact Information</h2>
          <p className="text-gray-700 leading-relaxed">
            If you have questions about this privacy policy or how we handle data, 
            please contact the system administrators.
          </p>
        </section>
      </div>
    </div>
  )
}