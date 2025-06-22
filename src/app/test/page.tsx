'use client';

import { useState } from 'react';
import MoneyGramWebView from '@/components/MoneyGramWebView';
import Link from 'next/link';

interface TestResult {
    success: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any;
    error?: string;
}

export default function TestPage() {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<Record<string, TestResult>>({});
    const [newAccountPublicKey, setNewAccountPublicKey] = useState<string | null>(null);
    const [usdcAmount, setUsdcAmount] = useState<string>('10');

    const [showWebView, setShowWebView] = useState(false);
    const [webViewData, setWebViewData] = useState<{
        transactionId: string;
        webviewUrl: string;
    } | null>(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const testEndpoint = async (name: string, endpoint: string, method: 'GET' | 'POST', body?: any) => {
        setLoading(true);
        try {
            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: body ? JSON.stringify(body) : undefined,
            });

            const data = await response.json();
            
            setResults(prev => ({
                ...prev,
                [name]: {
                    success: response.ok,
                    data: data,
                    error: response.ok ? undefined : data.error || 'Unknown error'
                }
            }));

            if (response.ok && name === 'create-account' && data.stellar?.publicKey) {
                setNewAccountPublicKey(data.stellar.publicKey);
            }

            return data;
        } catch (error) {
            setResults(prev => ({
                ...prev,
                [name]: {
                    success: false,
                    error: error instanceof Error ? error.message : 'Network error'
                }
            }));
        } finally {
            setLoading(false);
        }
    };

    const handleWebViewFlow = async () => {
        console.log('Starting WebView Flow...');
        const result = await testEndpoint(
            'webview-init',
            '/api/moneygram/webview',
            'POST',
            {
                amount: '1',
                // Use the created account if available
                account: newAccountPublicKey, 
                userId: 'test_user_' + Date.now()
            }
        );

        console.log('WebView Flow result:', result);

        if (result?.success && result?.transactionId && result?.webviewUrl) {
            console.log('Setting webview data:', {
                transactionId: result.transactionId,
                webviewUrl: result.webviewUrl
            });
            setWebViewData({
                transactionId: result.transactionId,
                webviewUrl: result.webviewUrl
            });
            setShowWebView(true);
        } else {
            console.error('WebView Flow failed:', result);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleWebViewStatusChange = (status: string, transactionData: any) => {
        console.log('WebView Status Change:', status, transactionData);
        
        // If the webview is closed, check the final status
        if (status === 'pending_user_transfer_start') {
            setTimeout(() => {
                // Send funds automatically
                testEndpoint(
                    'send-funds',
                    '/api/moneygram/send-funds',
                    'POST',
                    { transactionId: webViewData?.transactionId }
                );
            }, 1000);
        }
        
        // If it is a manual check, check the status
        if (status === 'manual_check' && webViewData?.transactionId) {
            testEndpoint(
                'manual-status-check',
                `/api/moneygram/webview?transactionId=${webViewData.transactionId}`,
                'GET'
            );
        }
    };

    const handleWebViewClose = () => {
        setShowWebView(false);
        setWebViewData(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Off-Ramp Integration Testing</h1>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Stellar Endpoints */}
                    <div className="bg-white rounded-lg shadow p-6 space-y-4">
                        <h2 className="text-xl font-semibold text-blue-600">1. Stellar Account</h2>
                        
                        <button
                            onClick={() => testEndpoint(
                                'create-account',
                                '/api/stellar/create-account',
                                'POST',
                                { pin: '1234' }
                            )}
                            disabled={loading}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading && !newAccountPublicKey ? 'Creating...' : 'Create Account & Trustline'}
                        </button>
                        
                        {newAccountPublicKey && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                                <p className="text-sm font-semibold text-blue-800">Account Created!</p>
                                <p className="text-xs text-blue-700 break-words">{newAccountPublicKey}</p>
                            </div>
                        )}

                        <h2 className="text-xl font-semibold text-green-600 pt-4">2. Fund Account</h2>

                        <div className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={usdcAmount}
                                onChange={(e) => setUsdcAmount(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="USDC Amount"
                            />
                            <button
                                onClick={() => testEndpoint(
                                    'send-usdc',
                                    '/api/stellar/send-usdc',
                                    'POST',
                                    { destination: newAccountPublicKey, amount: usdcAmount }
                                )}
                                disabled={loading || !newAccountPublicKey}
                                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                            >
                                {loading ? 'Sending...' : 'Send USDC'}
                            </button>
                        </div>
                        
                        <button
                            onClick={() => {
                                const account = newAccountPublicKey || prompt('Enter account public key to check balance:');
                                if (account) {
                                    testEndpoint(
                                        'check-balance',
                                        `/api/stellar/balance?account=${account}`,
                                        'GET'
                                    );
                                }
                            }}
                            disabled={loading}
                            className="w-full px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50"
                        >
                            {loading ? 'Checking...' : 'Check USDC Balance'}
                        </button>
                    </div>

                    {/* MoneyGram Endpoints */}
                    <div className="bg-white rounded-lg shadow p-6 space-y-4">
                        <h2 className="text-xl font-semibold text-purple-600">3. MoneyGram Off-Ramp</h2>
                        
                        <button
                            onClick={handleWebViewFlow}
                            disabled={loading || !newAccountPublicKey}
                            className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                        >
                            {loading ? 'Starting...' : 'Start MoneyGram KYC/Withdrawal'}
                        </button>
                        
                        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                            <h3 className="font-semibold text-yellow-800 mb-2">Manual Checks</h3>
                            <input
                                type="text"
                                placeholder="Transaction ID for status check"
                                id="transactionId"
                                className="w-full mb-2 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            />
                            <button
                                onClick={() => {
                                    const transactionId = (document.getElementById('transactionId') as HTMLInputElement).value;
                                    if (transactionId) {
                                        testEndpoint(
                                            'status-check',
                                            `/api/moneygram/status?transactionId=${transactionId}`,
                                            'GET'
                                        );
                                    }
                                }}
                                disabled={loading}
                                className="w-full px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                            >
                                {loading ? 'Checking...' : 'Check Status'}
                            </button>

                            <button
                                onClick={() => testEndpoint(
                                    'debug-config',
                                    '/api/debug/config',
                                    'GET'
                                )}
                                disabled={loading}
                                className="w-full mt-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                            >
                                {loading ? 'Checking...' : 'Check Anchor Config'}
                            </button>
                        </div>
                    </div>

                    {/* Results */}
                    <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4 text-gray-600">Test Results</h2>
                        
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {Object.entries(results).map(([name, result]) => (
                                <div key={name} className={`p-3 rounded border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                    <h3 className="font-semibold text-sm capitalize">{name.replace(/-/g, ' ')}</h3>
                                    <div className="text-xs mt-1">
                                        {result.success ? (
                                            <pre className="whitespace-pre-wrap text-green-800">
                                                {JSON.stringify(result.data, null, 2)}
                                            </pre>
                                        ) : (
                                            <p className="text-red-800">{result.error}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Instructions */}
                <div className="mt-8 bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Testing Instructions</h2>
                    
                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                        <li>Click <b>Create Account & Trustline</b> to generate a new Stellar wallet.</li>
                        <li>The new Public Key will appear. Use this key for the next steps.</li>
                        <li>Click <b>Send USDC</b> to fund the new account with test USDC.</li>
                        <li>Click <b>Check USDC Balance</b> to verify the funds arrived.</li>
                        <li>Once funded, click <b>Start MoneyGram KYC/Withdrawal</b>.</li>
                        <li>Complete the KYC process in the MoneyGram popup window.</li>
                        <li>After completion, the backend will attempt to send the funds to MoneyGram.</li>
                        <li>You can use the <b>Manual Checks</b> to verify transaction status or the anchors configuration.</li>
                    </ol>
                    
                    <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded">
                        <h3 className="font-semibold text-gray-800 mb-2">Debugging Tools</h3>
                        <p className="text-sm text-gray-700 mb-3">
                            If the webview communication fails, you can use these pages to debug:
                        </p>
                        <div className="flex gap-2">
                            <Link
                                href="/test/simulate-message"
                                className="inline-block px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                            >
                                Simulate PostMessage
                            </Link>
                            <Link
                                href="/test/config"
                                className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                            >
                                Configure Anchor
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* WebView Modal */}
            {showWebView && webViewData && (
                <MoneyGramWebView
                    transactionId={webViewData.transactionId}
                    webviewUrl={webViewData.webviewUrl}
                    onStatusChange={handleWebViewStatusChange}
                    onClose={handleWebViewClose}
                />
            )}
        </div>
    );
} 