import React, { useState } from 'react';
import './styles/globals.css';
import PageTransition from './components/PageTransition';
import Hero from './components/Hero';
import ThreeViewer from './components/ThreeViewer';
import Uploader from './components/Uploader';
import StatusTracker from './StatusTracker';
import ChatInterface from './components/ChatInterface';

// Using Tailwind CSS instead of styled-components

function App() {
  const [currentJob, setCurrentJob] = useState(null);
  const [modelUrl, setModelUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCreatePage, setShowCreatePage] = useState(false);

  // eslint-disable-next-line no-unused-vars
  const handleUploadSuccess = (jobData) => {
    setCurrentJob(jobData);
    setIsProcessing(true);
    setModelUrl(null);
  };

  const handleJobComplete = (jobData) => {
    setIsProcessing(false);
    if (jobData.status === 'finished') {
      setModelUrl(jobData.model_url);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleNewUpload = () => {
    setCurrentJob(null);
    setModelUrl(null);
    setIsProcessing(false);
  };

  const handleJobCreated = (newModelUrl) => {
    setModelUrl(newModelUrl);
    setIsProcessing(false);
  };

  if (showCreatePage) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-purple-50">
          {/* Navigation */}
          <nav className="flex justify-between items-center p-6">
            <div className="text-xl font-heading font-bold text-gray-800">
              Hapve
            </div>
            <button
              onClick={() => setShowCreatePage(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Back to Home
            </button>
          </nav>

          {/* Create Page Content */}
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Upload Section */}
              <div className="pt-animate">
                <h1 className="text-4xl font-heading font-bold text-gray-900 mb-6">
                  Create Your Avatar
                </h1>

                <div className="glass-effect rounded-xl p-6 mb-8">
                  <h3 className="text-lg font-semibold mb-4">How it works:</h3>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-center">
                      <span className="w-6 h-6 bg-accentStart text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
                      Upload a clear photo of a person
                    </li>
                    <li className="flex items-center">
                      <span className="w-6 h-6 bg-accentMid text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
                      Our AI detects and aligns the face
                    </li>
                    <li className="flex items-center">
                      <span className="w-6 h-6 bg-accentEnd text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
                      PIFuHD generates a 3D model
                    </li>
                    <li className="flex items-center">
                      <span className="w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">4</span>
                      View your interactive avatar
                    </li>
                  </ul>
                </div>

                <Uploader onJobCreated={handleJobCreated} />

                {currentJob && (
                  <div className="mt-6">
                    <StatusTracker
                      jobId={currentJob.job_id}
                      onJobComplete={handleJobComplete}
                    />
                  </div>
                )}
              </div>

              {/* 3D Viewer */}
              <div className="pt-animate">
                <h2 className="text-2xl font-heading font-bold text-gray-900 mb-6">
                  3D Preview
                </h2>

                <div className="h-[600px] rounded-xl overflow-hidden shadow-2xl bg-white relative">
                  {isProcessing ? (
                    <div className="flex items-center justify-center h-full flex-col text-gray-600">
                      <div className="loading-spinner w-12 h-12 border-4 border-gray-200 border-t-accentStart rounded-full mb-4"></div>
                      <p className="text-lg font-medium">Generating your 3D avatar...</p>
                      <p className="text-sm opacity-70 mt-2">
                        This may take 2-5 minutes
                      </p>
                    </div>
                  ) : modelUrl ? (
                    <>
                      <ThreeViewer modelUrl={modelUrl} />
                      <ChatInterface />
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <div className="text-6xl mb-4 opacity-50">🎭</div>
                        <p className="text-xl font-medium">Your avatar will appear here</p>
                        <p className="text-sm mt-2 opacity-70">
                          Upload a photo to generate your 3D avatar
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {modelUrl && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="text-green-500 mr-2">✅</div>
                      <div className="text-green-800 font-medium">
                        Avatar generated successfully! You can rotate and zoom the model above.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen">
        {/* Hero Section */}
        <Hero
          modelUrl={modelUrl}
          demoVideoUrl="/demo-video.mp4"
        />

        {/* CTA Section */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto text-center px-6">
            <h2 className="text-4xl font-heading font-bold text-gray-900 mb-6">
              Ready to Create Your Digital Twin?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Transform any photo into an interactive 3D avatar with our advanced AI technology.
              Perfect for gaming, social media, or preserving memories.
            </p>
            <button
              onClick={() => setShowCreatePage(true)}
              className="cta-primary rounded-lg px-8 py-4 text-lg font-semibold"
            >
              Start Creating Now
            </button>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-heading font-bold text-center text-gray-900 mb-16">
              Why Choose Hapve?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-gradient-to-r from-accentStart to-accentMid rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">AI-Powered</h3>
                <p className="text-gray-600">Advanced PIFuHD technology for realistic 3D reconstruction</p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-gradient-to-r from-accentMid to-accentEnd rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Fast Processing</h3>
                <p className="text-gray-600">Generate your avatar in minutes, not hours</p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-gradient-to-r from-accentEnd to-accentStart rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔒</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Privacy First</h3>
                <p className="text-gray-600">Your data is secure and you control your avatars</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}

export default App;
