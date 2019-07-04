<template>
  <div class="em-editor">
    <div class="em-editor__editor">
      <h2>返回参数</h2>
      <div ref="codeEditor"></div>
      <h2>请求参数</h2>
      <div ref="bodyEditor"></div>
      <h2>请求头</h2>
      <div ref="headerEditor"></div>
    </div>
    <div class="panel-info">
      <em-spots :size="10"></em-spots>
      <div class="wrapper">
        <h2>{{isEdit ? $t('p.detail.editor.title[0]') : $t('p.detail.editor.title[1]')}}</h2>
        <div class="em-editor__form">
          <Form label-position="top">
            <Form-item label="Method">
              <i-select v-model="temp.method">
                <Option v-for="item in methods" :value="item.value" :key="item.value">{{ item.label }}</Option>
              </i-select>
            </Form-item>
            <Form-item label="URL">
              <i-input v-model="temp.url">
                <span slot="prepend">/</span>
              </i-input>
            </Form-item>
            <Form-item :label="$t('p.detail.columns[0]')">
              <i-input v-model="temp.description"></i-input>
            </Form-item>
            <Form-item :label="$t('p.detail.editor.encode')">
              <i-switch v-model="temp.encode"></i-switch>
            </Form-item>
            <Form-item :label="$t('p.detail.editor.proxy')">
              <i-switch v-model="temp.proxy"></i-switch>
            </Form-item>
            <Form-item :label="$t('p.detail.editor.proxyUrl')" v-if="temp.proxy">
              <i-input v-model="temp.proxyUrl"></i-input>
            </Form-item>
            <Form-item :label="$t('p.detail.editor.autoClose')" v-if="isEdit">
              <i-switch v-model="autoClose"></i-switch>
            </Form-item>

            <Form-item>
              <Button type="primary" long @click="submit">{{isEdit ? $t('p.detail.editor.action[0]') : $t('p.detail.editor.action[1]')}}</Button>
            </Form-item>
          </Form>
        </div>
        <div class="em-editor__control">
          <div class="em-proj-detail__switcher">
            <ul>
              <li @click="format">{{$t('p.detail.editor.control[0]')}}</li>
              <li @click="preview" v-if="isEdit">{{$t('p.detail.editor.control[1]')}}</li>
              <li @click="close">{{$t('p.detail.editor.control[2]')}}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
  @import './index.css';
</style>

<script>
  import * as api from '../../api'
  import jsBeautify from 'js-beautify/js/lib/beautify'

  let ace

  if (typeof window !== 'undefined') {
    ace = require('brace')
    require('brace/mode/javascript')
    require('brace/theme/monokai')
    require('brace/ext/language_tools')
    require('brace/ext/searchbox')
    require('./snippets')
  }

  export default {
    name: 'editor',
    data () {
      return {
        codeEditor: null,
        bodyEditor: null,
        headerEditor: null,
        autoClose: true,
        methods: [
          {label: 'get', value: 'get'},
          {label: 'post', value: 'post'},
          {label: 'put', value: 'put'},
          {label: 'delete', value: 'delete'},
          {label: 'patch', value: 'patch'}
        ],
        temp: {
          url: '',
          mode: '{"data": {}}',
          method: 'get',
          encode: false,
          proxy: false,
          proxyUrl: '',
          body: '',
          header: '',
          description: ''
        }
      }
    },
    computed: {
      mockData () {
        return this.$store.state.mock.editorData.mock
      },
      baseUrl () {
        return this.$store.state.mock.editorData.baseUrl
      },
      projectId () {
        return this.$route.params.projectId
      },
      isEdit () {
        return !!this.$route.params.id && this.mockData
      }
    },
    beforeRouteEnter (to, from, next) {
      if (from.matched.length === 0) { // 防止编辑页刷新导致的显示异常（直接进入项目主页）
        return next({
          path: `/project/${to.params.projectId}`,
          replace: true
        })
      }
      next()
    },
    mounted () {
      this.codeEditor = ace.edit(this.$refs.codeEditor)
      this.codeEditor.getSession().setMode('ace/mode/javascript')
      this.codeEditor.setTheme('ace/theme/monokai')
      this.codeEditor.setOption('tabSize', 2)
      this.codeEditor.setOption('fontSize', 15)
      this.codeEditor.setOption('enableLiveAutocompletion', true)
      this.codeEditor.setOption('enableSnippets', true)
      this.codeEditor.clearSelection()
      this.codeEditor.getSession().setUseWorker(false)
      this.codeEditor.commands.addCommand({
        name: 'save',
        bindKey: {win: 'Ctrl-S', mac: 'Command-S'},
        exec: () => {
          this.submit()
        }
      })
      this.bodyEditor = ace.edit(this.$refs.bodyEditor)
      this.bodyEditor.getSession().setMode('ace/mode/javascript')
      this.bodyEditor.setTheme('ace/theme/monokai')
      this.bodyEditor.setOption('tabSize', 2)
      this.bodyEditor.setOption('fontSize', 15)
      this.bodyEditor.setOption('enableLiveAutocompletion', true)
      this.bodyEditor.setOption('enableSnippets', true)
      this.bodyEditor.clearSelection()
      this.bodyEditor.getSession().setUseWorker(false)
      this.bodyEditor.commands.addCommand({
        name: 'save',
        bindKey: {win: 'Ctrl-S', mac: 'Command-S'},
        exec: () => {
          this.submit()
        }
      })
      this.headerEditor = ace.edit(this.$refs.headerEditor)
      this.headerEditor.getSession().setMode('ace/mode/javascript')
      this.headerEditor.setTheme('ace/theme/monokai')
      this.headerEditor.setOption('tabSize', 2)
      this.headerEditor.setOption('fontSize', 15)
      this.headerEditor.setOption('enableLiveAutocompletion', true)
      this.headerEditor.setOption('enableSnippets', true)
      this.headerEditor.clearSelection()
      this.headerEditor.getSession().setUseWorker(false)
      this.headerEditor.commands.addCommand({
        name: 'save',
        bindKey: {win: 'Ctrl-S', mac: 'Command-S'},
        exec: () => {
          this.submit()
        }
      })
      if (this.isEdit) {
        this.autoClose = true
        this.temp.url = this.mockData.url.slice(1) // remove /
        this.temp.mode = this.mockData.mode
        this.temp.method = this.mockData.method
        this.temp.description = this.mockData.description
        this.temp.encode = this.mockData.encode
        this.temp.proxy = this.mockData.proxy
        this.temp.proxyUrl = this.mockData.proxyUrl
        this.temp.body = this.mockData.body
        this.temp.header = this.mockData.header
      }

      this.$nextTick(() => {
        console.log('next', this.temp)
        this.codeEditor.setValue(this.temp.mode)
        this.bodyEditor.setValue(this.temp.body)
        this.headerEditor.setValue(this.temp.header)
        this.headerEditor.on('change', this.onChange)
        this.codeEditor.on('change', this.onChange)
        this.bodyEditor.on('change', this.onChange)
        this.format()
      })
    },
    methods: {
      convertUrl (url) {
        const newUrl = '/' + url
        return newUrl === '/'
          ? '/'
          : newUrl.replace(/\/\//g, '/').replace(/\/$/, '')
      },
      format () {
        const context = this.codeEditor.getValue()
        let code = /^http(s)?/.test(context)
          ? context
          : jsBeautify.js_beautify(context, {indent_size: 2})
        this.codeEditor.setValue(code)
        const body = this.bodyEditor.getValue()
        let bodycode = jsBeautify.js_beautify(body, {indent_size: 2})
        this.bodyEditor.setValue(bodycode)
        const header = this.headerEditor.getValue()
        let headercode = jsBeautify.js_beautify(header, {indent_size: 2})
        this.headerEditor.setValue(headercode)
      },
      onChange () {
        this.temp.mode = this.codeEditor.getValue()
        this.temp.body = this.bodyEditor.getValue()
        this.temp.header = this.headerEditor.getValue()
      },
      close () {
        this.$store.commit('mock/SET_EDITOR_DATA', {mock: null, baseUrl: ''})
        this.$router.replace(`/project/${this.projectId}`)
      },
      submit () {
        const mockUrl = this.convertUrl(this.temp.url)
        try {
          const value = (new Function(`return ${this.temp.mode}`))() // eslint-disable-line
          if (!value) {
            this.$Message.error(this.$t('p.detail.editor.submit.error[0]'))
            return
          } else if (typeof value !== 'object') {
            throw new Error()
          }
        } catch (error) {
          if (!/^http(s)?:\/\//.test(this.temp.mode)) {
            this.$Message.error(error.message || this.$t('p.detail.editor.submit.error[1]'))
            return
          }
        }

        console.log(this.temp)
        if (this.isEdit) {
          api.mock.update({
            data: {
              ...this.temp,
              id: this.mockData._id,
              url: mockUrl
            }
          }).then((res) => {
            if (res.data.success) {
              this.$Message.success(this.$t('p.detail.editor.submit.updateSuccess'))
              if (this.autoClose) this.close()
            }
          })
        } else {
          api.mock.create({
            data: {
              ...this.temp,
              url: mockUrl,
              project_id: this.projectId
            }
          }).then((res) => {
            if (res.data.success) {
              this.$Message.success(this.$t('p.detail.create.success'))
              this.close()
            }
          })
        }
      },
      preview () {
        let params = []
        params.push(encodeURIComponent('method') + '=' + encodeURIComponent(this.mockData.method))
        if (this.mockData.body) {
          params.push(encodeURIComponent('body') + '=' + encodeURIComponent(JSON.stringify(JSON.parse(this.mockData.body), null, '\t')))
        }
        if (this.mockData.header) {
          try {
            let headerObj = JSON.parse(this.mockData.header)
            let header = []
            for (let k in headerObj) {
              header.push({key: k, value: headerObj[k]})
            }
            params.push(encodeURIComponent('headers') + '=' + encodeURIComponent(JSON.stringify(header)))
          } catch (e) {
          }
        }
        window.open(this.baseUrl + this.mockData.url + '#!' + params.join('&'))
      }
    }
  }
</script>
