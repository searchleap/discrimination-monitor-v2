export default function AccessibilityPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Accessibility Statement</h1>
      
      <div className="prose prose-gray max-w-none">
        <p className="text-gray-600 mb-6">Last updated: January 2025</p>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Commitment</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            The Discrimination Monitor is committed to ensuring digital accessibility for 
            all users, including those with disabilities. We strive to adhere to Web Content 
            Accessibility Guidelines (WCAG) 2.1 Level AA standards.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Accessibility Features</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Our platform includes the following accessibility features:
          </p>
          <ul className="list-disc ml-6 text-gray-700 mb-4">
            <li>Semantic HTML markup for screen reader compatibility</li>
            <li>Keyboard navigation support</li>
            <li>High contrast color schemes</li>
            <li>Descriptive alt text for images</li>
            <li>Clear heading structure</li>
            <li>Responsive design for various devices</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Ongoing Efforts</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            We continuously work to improve the accessibility of our platform through:
          </p>
          <ul className="list-disc ml-6 text-gray-700 mb-4">
            <li>Regular accessibility audits</li>
            <li>User testing with assistive technologies</li>
            <li>Updates based on accessibility feedback</li>
            <li>Team training on accessibility best practices</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Feedback</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            We welcome feedback on the accessibility of our platform. If you encounter 
            any accessibility barriers or have suggestions for improvement, please contact 
            our team.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Alternative Access</h2>
          <p className="text-gray-700 leading-relaxed">
            If you need assistance accessing any information on our platform, we are 
            committed to providing alternative access methods. Please reach out to our 
            support team for assistance.
          </p>
        </section>
      </div>
    </div>
  )
}