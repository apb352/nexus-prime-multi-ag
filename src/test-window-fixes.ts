// Test file to verify window object access is properly guarded
export function testWindowAccess() {
  console.log('Testing window object access...');
  
  // Test 1: Basic window availability check
  if (typeof window !== 'undefined') {
    console.log('✓ Window object is available');
  } else {
    console.warn('✗ Window object is not available');
  }
  
  // Test 2: Event listener availability
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    console.log('✓ window.addEventListener is available');
  } else {
    console.warn('✗ window.addEventListener is not available');
  }
  
  // Test 3: Custom event dispatch availability
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    console.log('✓ window.dispatchEvent is available');
  } else {
    console.warn('✗ window.dispatchEvent is not available');
  }
  
  // Test 4: Spark global availability
  if (typeof window !== 'undefined' && typeof spark !== 'undefined') {
    console.log('✓ Spark global is available');
    console.log('Available spark methods:', Object.keys(spark));
  } else {
    console.warn('✗ Spark global is not available');
  }
  
  return true;
}

// Run test on module load in development with proper guards
if (import.meta.env.DEV && typeof window !== 'undefined') {
  setTimeout(() => {
    testWindowAccess();
  }, 1000);
}