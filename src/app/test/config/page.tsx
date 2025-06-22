'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ConfigPage() {
    const [useSdfAnchor, setUseSdfAnchor] = useState(false);

    useEffect(() => {
        // Load current configuration
        const loadConfig = async () => {
            try {
                const response = await fetch('/api/config');
                if (response.ok) {
                    const data = await response.json();
                    setUseSdfAnchor(data.useSdfAnchor || false);
                }
            } catch (error) {
                console.error('Error loading config:', error);
            }
        };
        
        loadConfig();
    }, []);

    const updateConfig = async () => {
        try {
            const response = await fetch('/api/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ useSdfAnchor }),
            });

            if (response.ok) {
                alert('Configuration updated! Please restart the development server.');
            } else {
                alert('Error updating configuration');
            }
        } catch (error) {
            console.error('Error updating config:', error);
            alert('Error updating configuration');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Configuration</h1>
                    <Link
                        href="/test"
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                        Back to Testing
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Anchor Configuration */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4 text-blue-600">Anchor Configuration</h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="anchor"
                                        checked={!useSdfAnchor}
                                        onChange={() => setUseSdfAnchor(false)}
                                        className="mr-2"
                                    />
                                    <div>
                                        <span className="font-semibold">MoneyGram Testnet</span>
                                        <p className="text-sm text-gray-600">Use MoneyGram&apos;s test environment (requires registration)</p>
                                    </div>
                                </label>
                            </div>
                            
                            <div>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="anchor"
                                        checked={useSdfAnchor}
                                        onChange={() => setUseSdfAnchor(true)}
                                        className="mr-2"
                                    />
                                    <div>
                                        <span className="font-semibold">SDF Test Anchor</span>
                                        <p className="text-sm text-gray-600">Use Stellar Development Foundation&apos;s test anchor (recommended for development)</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <button
                            onClick={updateConfig}
                            className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Update Configuration
                        </button>
                    </div>

                    {/* Current Configuration */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4 text-green-600">Current Configuration</h2>
                        
                        <div className="space-y-3">
                            <div>
                                <span className="font-semibold">Active Anchor:</span>
                                <span className={`ml-2 px-2 py-1 rounded text-sm ${useSdfAnchor ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                    {useSdfAnchor ? 'SDF Test Anchor' : 'MoneyGram Testnet'}
                                </span>
                            </div>
                            
                            <div>
                                <span className="font-semibold">Anchor URL:</span>
                                <p className="text-sm text-gray-600 mt-1">
                                    {useSdfAnchor ? 'https://testanchor.stellar.org' : 'https://extmganchor.moneygram.com'}
                                </p>
                            </div>
                            
                            <div>
                                <span className="font-semibold">Network:</span>
                                <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                                    Testnet
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-gray-50 rounded">
                            <h3 className="font-semibold mb-2">Environment Variables</h3>
                            <div className="text-sm space-y-1">
                                <div><code>MONEYGRAM_USE_SDF_ANCHOR={useSdfAnchor ? 'true' : 'false'}</code></div>
                                <div><code>STELLAR_NETWORK=testnet</code></div>
                                <div><code>STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org</code></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Information */}
                <div className="mt-8 bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Anchor Information</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold text-blue-600 mb-2">SDF Test Anchor</h3>
                            <ul className="text-sm text-gray-700 space-y-1">
                                <li>• Official Stellar Development Foundation test anchor</li>
                                <li>• No registration required</li>
                                <li>• Supports USDC and SRT tokens</li>
                                <li>• Perfect for development and testing</li>
                                <li>• Webview and postMessage work correctly</li>
                            </ul>
                        </div>
                        
                        <div>
                            <h3 className="font-semibold text-green-600 mb-2">MoneyGram Testnet</h3>
                            <ul className="text-sm text-gray-700 space-y-1">
                                <li>• MoneyGram&apos;s official test environment</li>
                                <li>• Requires registration with MoneyGram</li>
                                <li>• Production-like testing</li>
                                <li>• May have postMessage issues in development</li>
                                <li>• Use for final integration testing</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 