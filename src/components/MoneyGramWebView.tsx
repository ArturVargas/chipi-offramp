'use client';

import { useState, useEffect, useRef } from 'react';

interface MoneyGramWebViewProps {
    transactionId: string;
    webviewUrl: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onStatusChange: (status: string, transactionData: any) => void;
    onClose: () => void;
}

export default function MoneyGramWebView({ 
    transactionId, 
    webviewUrl, 
    onStatusChange, 
    onClose 
}: MoneyGramWebViewProps) {
    const [status, setStatus] = useState<string>('opening');
    const webviewRef = useRef<Window | null>(null);

    useEffect(() => {
        console.log('MoneyGramWebView mounted with:', {
            transactionId,
            webviewUrl,
            showWebView: true
        });
        
        // Open webview when the component mounts
        openWebView();
        
        // Global listener for all postMessages (for debugging)
        const globalMessageHandler = (event: MessageEvent) => {
            console.log('=== GLOBAL POSTMESSAGE DEBUG ===');
            console.log('Origin:', event.origin);
            console.log('Data:', event.data);
            console.log('Source:', event.source);
            console.log('================================');
        };
        
        // Configure listener for postMessage
        const handleMessage = (event: MessageEvent) => {
            console.log('PostMessage received:', event.data);
            console.log('PostMessage origin:', event.origin);
            console.log('Expected transaction ID:', transactionId);
            
            // Verify that the message comes from MoneyGram or localhost (for development)
            const allowedOrigins = [
                'https://extstellar.moneygram.com',
                'https://stellar.moneygram.com',
                'http://localhost:3000', // For development
                'https://localhost:3000'  // For development with HTTPS
            ];
            
            if (!allowedOrigins.includes(event.origin)) {
                console.log('PostMessage ignored - wrong origin:', event.origin);
                console.log('Allowed origins:', allowedOrigins);
                return;
            }

            console.log('PostMessage origin accepted:', event.origin);
            console.log('Full message data:', event.data);

            const transactionData = event.data.transaction;
            if (transactionData && transactionData.id === transactionId) {
                console.log(`Transaction ${transactionData.id} is in status ${transactionData.status}`);
                console.log('Full transaction data:', transactionData);
                
                setStatus(transactionData.status);
                onStatusChange(transactionData.status, transactionData);

                // If the status is pending_user_transfer_start, close webview
                if (transactionData.status === 'pending_user_transfer_start') {
                    console.log('Closing webview - user completed KYC');
                    closeWebView();
                }
            } else {
                console.log('PostMessage ignored - transaction ID mismatch or no transaction data');
                console.log('Received transaction data:', transactionData);
                console.log('Looking for transaction ID:', transactionId);
                
                // Check if the message has a different structure
                if (event.data.id === transactionId) {
                    console.log('Found transaction ID in root of message data');
                    const status = event.data.status || 'unknown';
                    console.log(`Transaction ${event.data.id} is in status ${status}`);
                    
                    setStatus(status);
                    onStatusChange(status, event.data);

                    if (status === 'pending_user_transfer_start') {
                        console.log('Closing webview - user completed KYC');
                        closeWebView();
                    }
                }
            }
        };

        window.addEventListener('message', globalMessageHandler);
        window.addEventListener('message', handleMessage);

        // Cleanup
        return () => {
            window.removeEventListener('message', globalMessageHandler);
            window.removeEventListener('message', handleMessage);
            if (webviewRef.current && !webviewRef.current.closed) {
                webviewRef.current.close();
            }
        };
    }, [transactionId, onStatusChange]);

    const openWebView = () => {
        try {
            console.log('Opening webview with URL:', webviewUrl);
            console.log('Transaction ID:', transactionId);
            
            // Open webview with specific dimensions
            webviewRef.current = window.open(
                webviewUrl,
                'moneygram_webview',
                'width=500,height=800,scrollbars=yes,resizable=yes'
            );

            if (webviewRef.current) {
                setStatus('opened');
                console.log('MoneyGram webview opened successfully');
            } else {
                console.error('Failed to open webview - window.open returned null');
                setStatus('error');
            }
        } catch (error) {
            console.error('Error opening webview:', error);
            setStatus('error');
        }
    };

    const closeWebView = () => {
        if (webviewRef.current && !webviewRef.current.closed) {
            webviewRef.current.close();
        }
        onClose();
    };

    const getStatusMessage = () => {
        switch (status) {
            case 'opening':
                return 'Opening MoneyGram...';
            case 'opened':
                return 'MoneyGram opened - Complete KYC';
            case 'pending_user_transfer_start':
                return 'KYC completed - Closing webview';
            case 'error':
                return 'Error opening MoneyGram';
            default:
                return `Status: ${status}`;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">MoneyGram</h2>
                    <button
                        onClick={closeWebView}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                        {getStatusMessage()}
                    </p>
                    
                    {status === 'opened' && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-3">
                            <p className="text-sm text-blue-800">
                                <strong>Instructions:</strong>
                            </p>
                            <ul className="text-sm text-blue-700 mt-1 list-disc list-inside">
                                <li>Complete the KYC process in MoneyGram</li>
                                <li>The webview will close automatically when it&apos;s done</li>
                                <li>If it doesn&apos;t close automatically, you can close it manually</li>
                            </ul>
                            <div className="mt-3 pt-3 border-t border-blue-200">
                                <p className="text-xs text-blue-600 mb-2">
                                    <strong>Debug:</strong> Transaction ID: {transactionId}
                                </p>
                                <button
                                    onClick={() => {
                                        console.log('Manual status check for transaction:', transactionId);
                                        // Trigger a manual status check
                                        onStatusChange('manual_check', { id: transactionId });
                                    }}
                                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                >
                                    Check Status Manually
                                </button>
                            </div>
                        </div>
                    )}

                    {status === 'pending_user_transfer_start' && (
                        <div className="bg-green-50 border border-green-200 rounded p-3">
                            <p className="text-sm text-green-800">
                                ✅ KYC completed successfully
                            </p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="bg-red-50 border border-red-200 rounded p-3">
                            <p className="text-sm text-red-800">
                                ❌ Error opening MoneyGram
                            </p>
                            <button
                                onClick={openWebView}
                                className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                            >
                                Retry
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex justify-end space-x-2">
                    <button
                        onClick={closeWebView}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
} 