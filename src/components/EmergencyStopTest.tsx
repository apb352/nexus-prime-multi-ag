import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle } from '@phosphor-icons/react';
import { windowManager } from '@/lib/window-manager';

export function EmergencyStopTest() {
  const [testResults, setTestResults] = useState<{
    windowRegistration: 'pass' | 'fail' | 'pending';
    stopFunctionality: 'pass' | 'fail' | 'pending';
  }>({
    windowRegistration: 'pending',
    stopFunctionality: 'pending'
  });

  const testWindowRegistration = () => {
    const activeWindows = windowManager.getActiveWindowIds();
    if (activeWindows.length > 0) {
      setTestResults(prev => ({ ...prev, windowRegistration: 'pass' }));
    } else {
      setTestResults(prev => ({ ...prev, windowRegistration: 'fail' }));
    }
  };

  const testStopFunctionality = () => {
    try {
      // This will test if the stop functions can be called without errors
      windowManager.forceStopAllWindows();
      setTestResults(prev => ({ ...prev, stopFunctionality: 'pass' }));
    } catch (error) {
      console.error('Stop functionality test failed:', error);
      setTestResults(prev => ({ ...prev, stopFunctionality: 'fail' }));
    }
  };

  const getStatusIcon = (status: 'pass' | 'fail' | 'pending') => {
    switch (status) {
      case 'pass':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'fail':
        return <XCircle size={16} className="text-red-500" />;
      case 'pending':
        return <AlertTriangle size={16} className="text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: 'pass' | 'fail' | 'pending') => {
    const variants = {
      pass: 'default',
      fail: 'destructive',
      pending: 'secondary'
    } as const;
    
    return (
      <Badge variant={variants[status]} className="ml-2">
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle size={20} />
          Emergency Stop Tests
        </CardTitle>
        <CardDescription>
          Test emergency stop functionality to ensure it works correctly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Window Registration</span>
            <div className="flex items-center">
              {getStatusIcon(testResults.windowRegistration)}
              {getStatusBadge(testResults.windowRegistration)}
            </div>
          </div>
          <Button
            onClick={testWindowRegistration}
            variant="outline"
            size="sm"
            className="w-full"
          >
            Test Window Registration
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Stop Functionality</span>
            <div className="flex items-center">
              {getStatusIcon(testResults.stopFunctionality)}
              {getStatusBadge(testResults.stopFunctionality)}
            </div>
          </div>
          <Button
            onClick={testStopFunctionality}
            variant="outline"
            size="sm"
            className="w-full"
          >
            Test Stop Functionality
          </Button>
        </div>

        <div className="text-xs text-muted-foreground mt-4">
          <p>1. Open a chat window first</p>
          <p>2. Test window registration</p>
          <p>3. Test stop functionality</p>
          <p>4. Try the emergency stop button</p>
        </div>
      </CardContent>
    </Card>
  );
}