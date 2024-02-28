import { CurioInfo } from '~/util/curio'

export const info: CurioInfo = {
  id: 'global-temperatures',
  title: 'Global Temperatures',
  created: new Date(2024, 2, 27),
  tags: [],
}

export default function GlobalTemperatures() {
  return (
    <main class='flex flex-col gap-8 p-8'>
      <h1 class='text-6xl font-thin'>Global Temperatures</h1>
      <p class='whitespace-pre-wrap'>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris maximus venenatis magna eget ornare. Integer
        efficitur odio nunc, vitae mattis diam vehicula vel. Nullam eu elementum tellus, eget mattis quam. Duis euismod
        leo id elit venenatis placerat sit amet et ligula. Curabitur id dolor sit amet enim placerat semper. Sed risus
        dui, venenatis a justo in, tristique elementum sem. Interdum et malesuada fames ac ante ipsum primis in
        faucibus.
        <br />
        <br />
        Nam aliquam euismod enim non tincidunt. Integer faucibus et nibh aliquam rutrum. Nam blandit massa sed velit
        finibus vulputate. Phasellus fringilla mollis dictum. Pellentesque tristique tellus eu ex tristique, vitae
        tempus odio vulputate. Aenean gravida elementum diam elementum malesuada. Suspendisse leo dui, aliquet in
        placerat sollicitudin, ultricies at lectus. Phasellus convallis magna id nulla vulputate, in pulvinar urna
        imperdiet.
        <br />
        <br />
        Phasellus risus mauris, sollicitudin sed neque a, sagittis semper nulla. Mauris id ipsum sed lorem dignissim
        pharetra vel nec lacus. Suspendisse in lectus semper, dapibus sapien ac, tincidunt nulla. Interdum et malesuada
        fames ac ante ipsum primis in faucibus. Ut et lacus eget dolor vehicula pulvinar sed eget risus. Nullam dictum
        pharetra urna nec fringilla. Nam nec congue mauris.
      </p>
    </main>
  )
}
