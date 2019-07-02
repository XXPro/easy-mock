'use strict'

const Md5 = require('md5')
const JSEncrypt = require('node-jsencrypt')
const JSRsasign = require('jsrsasign')
const CryptoJS = require('crypto-js')
module.exports = class EncodeUtil {
  static md5 (str) {
    return Md5(str).toString()
  }

  static ThreeDes (key, iv) {
    let _key = CryptoJS.enc.Utf8.parse(key)
    let _iv = CryptoJS.enc.Utf8.parse(iv)
    return {
      encode: function (value) {
        return CryptoJS.TripleDES.encrypt(value, _key, {
          iv: _iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        })
      },
      decode: function (value) {
        return CryptoJS.enc.Utf8.stringify(CryptoJS.TripleDES.decrypt({
          ciphertext: CryptoJS.enc.Base64.parse(value), iv: '', key: '', salt: ''
        }, _key, {
          iv: _iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        }))
      }
    }
  }

  static RSA (privateKey, publicKey) {
    const rsa = new JSEncrypt()
    const sign = new JSRsasign.Signature({
      'alg': 'SHA1withRSA'
    })
    sign.init(privateKey)
    rsa.setPublicKey(publicKey)
    rsa.setPrivateKey(privateKey)
    return {
      encode: function (value) {
        return rsa.encrypt(value)
      },
      decode: function (value) {
        return rsa.decrypt(value)
      },
      sign: function (value) {
        sign.updateString(value)
        return JSRsasign.hex2b64(sign.sign())
      },
      verify: function (value, sign) {
        sign.updateString(value)
        return sign.verify(sign)
      }
    }
  }
}
