export default (editor, opts = {}) => {
  const domc = editor.DomComponents
  let imageName, imageFormat, imagePosition
  let compInit = false

  domc.addType('responsive-image', {
    isComponent: el => {
      return el.tagName === 'IMG'
    },
    extend: 'image',
    model: {
      defaults: {
        tagName: 'img',
        droppable: false,
        attributes: {
          'data-srcset': '',
          'data-src': '',
          'data-gjs-format': '',
          'data-gjs-name': '',
          'data-gjs-position': '',
          sizes: '',
          width: '',
          alt: '',
          onload: '',
          class: 'img-fluid lazy',
          srcset: '',
          src: ''
        },
        traits: [
          {
            type: 'select',
            label: 'Image',
            name: 'name',
            changeProp: 1,
            options: [],
          },
          {
            type: 'select',
            label: 'Format',
            name: 'format',
            changeProp: 1,
            options: [],
          },
          {
            type: 'select',
            label: 'Position',
            name: 'position',
            changeProp: 1,
            options: [
              {id: 'ebg-left', name: 'Gauche'},
              {id: 'ebg-center', name: 'Centre'},
              {id: 'ebg-right', name: 'Droite'}
            ],
          }
        ],
        styles: `
        .ebg-left { display: block; float: left}
        .ebg-center {display: block; margin: 0 auto;}
        .ebg-right { display: block; float: right}
      `,
      },
      init() {

        // get available medias
        fetch('/admin/get-selected-media', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': document.querySelector('meta[name=csrf-token]').content,
          },
          body: JSON.stringify({
            item: document.querySelector('#modelItem').value,
            id: document.querySelector('#modelID').value
          })
        })
        .then((response) => response.json())
        .then(data => {
          let medias = []
          for (const [key, value] of Object.entries(data)) {
            medias.push({
              id: key,
              name : value
            })
          }
          this.getTrait('name').set('options', medias)
        })

        // get conversions format
        fetch('/admin/get-conversions-format')
        .then((response) => response.json())
        .then(data => {
          let formatValues = []
          for (const [key, value] of Object.entries(data)) {
            formatValues.push({
               id: key,
               name : value
            })
          }
          this.getTrait('format').set('options', formatValues)
        })

        if(!compInit) {
          const mainClasses = this.getClasses()
          if(mainClasses.includes('ebg-left')) {
            imagePosition = 'ebg-left'
          } else if(mainClasses.includes('ebg-center')) {
            imagePosition = 'ebg-center'
          } else if(mainClasses.includes('ebg-right')) {
            imagePosition = 'ebg-right'
          }

          // init traits
          imageName = this.attributes.name
          imageFormat = this.attributes.format
          compInit = true
        }

        // init events
        this.on('change:name', this.handleImageChange);
        this.on('change:format', this.handleFormatChange);
        this.on('change:position', this.handlePositionChange);
      },
      handleImageChange(component, value) {
        imageName = value
        if( imageName && imageFormat) {
          this.loadResponsiveImage()
        }
      },
      handleFormatChange(component, value) {
        imageFormat = value
        if( imageName && imageFormat) {
          this.loadResponsiveImage()
        }
      },
      handlePositionChange(component, value) {
        imagePosition = value
        this.removeClass(['ebg-left', 'ebg-center', 'ebg-right'])
        this.addClass(value)
        this.addAttributes({
          'data-gjs-position': imagePosition
        })
      },
      loadResponsiveImage() {
        fetch(`/admin/get-responsive-image/${imageName}/${imageFormat}`)
        .then((response) => response.text())
        .then(data => {

           this.replaceWith(data).addAttributes({
              'data-gjs-format': imageFormat,
              'data-gjs-name': imageName,
              'data-gjs-position': imagePosition
            })
            if(imagePosition) {
              this.addClass(imagePosition)
            }
        })
      }
    },

    view: {
      onRender({model}) {

        model.setAttributes( {
          ... model.attributes.attributes ,
          src: model.attributes.attributes['data-src'] ,
          'data-gjs-format': imageFormat,
          'data-gjs-name': imageName,
          'data-gjs-position': imagePosition
        })
        if(imagePosition) {
          model.addClass(imagePosition)
        }
      }
    },
  });
};
