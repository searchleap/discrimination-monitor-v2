export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
      
      <div className="prose prose-gray max-w-none">
        <p className="text-gray-600 mb-6">Last updated: January 2025</p>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Service Description</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            The Discrimination Monitor is a platform designed to track, analyze, and report on 
            discrimination-related incidents across various sectors and contexts. This service 
            aggregates public information from various sources to provide insights into discrimination 
            patterns affecting protected groups.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Data Usage</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            All data processed by this system comes from publicly available sources. We do not 
            collect personal information beyond what is necessary for system operation and 
            improvement.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Accuracy Disclaimer</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            While we strive for accuracy in our AI classification and analysis, this system 
            provides information for research and awareness purposes. Users should verify 
            information through primary sources before taking action.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Contact</h2>
          <p className="text-gray-700 leading-relaxed">
            For questions about these terms, please contact the system administrators.
          </p>
        </section>
      </div>
    </div>
  )
}