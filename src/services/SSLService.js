/**
 * SSL/TLS Configuration Service
 * Handles secure FTP connections with certificate management
 */

class SSLService {
  // Common SSL/TLS ports
  static PORTS = {
    FTP: 21,
    FTPS_IMPLICIT: 990,
    FTPS_EXPLICIT: 21,
    SFTP: 22,
  };

  // SSL/TLS versions
  static VERSIONS = {
    TLS_1_0: 'TLSv1.0',
    TLS_1_1: 'TLSv1.1',
    TLS_1_2: 'TLSv1.2',
    TLS_1_3: 'TLSv1.3',
  };

  /**
   * Get default configuration for explicit FTPS (FTPS over FTP on port 21)
   */
  static getExplicitFTPSConfig() {
    return {
      protocol: 'ftps',
      implicit: false,
      port: this.PORTS.FTPS_EXPLICIT,
      tlsVersion: this.VERSIONS.TLS_1_2,
      rejectUnauthorized: true,
      ciphers: [
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-ECDSA-AES256-GCM-SHA384',
        'AES256-GCM-SHA384',
      ],
    };
  }

  /**
   * Get default configuration for implicit FTPS (port 990)
   */
  static getImplicitFTPSConfig() {
    return {
      protocol: 'ftps',
      implicit: true,
      port: this.PORTS.FTPS_IMPLICIT,
      tlsVersion: this.VERSIONS.TLS_1_2,
      rejectUnauthorized: true,
      ciphers: [
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-ECDSA-AES256-GCM-SHA384',
        'AES256-GCM-SHA384',
      ],
    };
  }

  /**
   * Get default configuration for SFTP (SSH File Transfer Protocol)
   */
  static getSFTPConfig() {
    return {
      protocol: 'sftp',
      port: this.PORTS.SFTP,
      algorithms: {
        serverHostKey: ['ssh-rsa', 'ssh-dss'],
        encryption: ['aes128-ctr', 'aes256-ctr'],
        hmac: ['hmac-sha2-256', 'hmac-sha2-512'],
      },
    };
  }

  /**
   * Validate certificate chain
   */
  static validateCertificate(cert) {
    const errors = [];

    // Check expiration
    if (new Date(cert.notAfter) < new Date()) {
      errors.push('Certificate has expired');
    }

    // Check validity period
    if (new Date(cert.notBefore) > new Date()) {
      errors.push('Certificate is not yet valid');
    }

    // Check subject
    if (!cert.subject) {
      errors.push('Certificate has no subject');
    }

    // Check issuer
    if (!cert.issuer) {
      errors.push('Certificate has no issuer');
    }

    return {
      isValid: errors.length === 0,
      errors,
      expiresIn: this.getDaysUntilExpiration(cert.notAfter),
    };
  }

  /**
   * Get days until certificate expires
   */
  static getDaysUntilExpiration(notAfter) {
    const expDate = new Date(notAfter);
    const now = new Date();
    const diff = expDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Create secure context options
   */
  static createSecureContext(options = {}) {
    const defaults = {
      minVersion: 'TLSv1.2',
      maxVersion: 'TLSv1.3',
      rejectUnauthorized: options.rejectUnauthorized !== false,
    };

    return {
      ...defaults,
      ...options,
    };
  }

  /**
   * Get cipher suite recommendations
   */
  static getRecommendedCiphers() {
    return [
      'TLS_AES_256_GCM_SHA384',
      'TLS_CHACHA20_POLY1305_SHA256',
      'TLS_AES_128_GCM_SHA256',
      'ECDHE-RSA-AES256-GCM-SHA384',
      'ECDHE-ECDSA-AES256-GCM-SHA384',
      'ECDHE-RSA-CHACHA20-POLY1305',
      'ECDHE-ECDSA-CHACHA20-POLY1305',
    ];
  }

  /**
   * Validate hostname against certificate
   */
  static validateHostname(hostname, cert) {
    const subjectAltNames = cert.subjectAltName || '';
    const commonName = cert.subject?.CN;

    const validNames = [
      ...subjectAltNames.split(', ').map(san => san.replace('DNS:', '')),
      commonName,
    ].filter(Boolean);

    return validNames.some(name => this.matchHostname(hostname, name));
  }

  /**
   * Match hostname with wildcard support
   */
  static matchHostname(hostname, pattern) {
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*');
    return new RegExp(`^${regexPattern}$`).test(hostname);
  }
}

export default SSLService;
