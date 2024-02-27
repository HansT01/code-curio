import { clientOnly } from '@solidjs/start'

const P5Demo = clientOnly(() => import('~/components/p5/demo'))

export default function Home() {
  return (
    <main class='flex flex-col gap-8 p-8'>
      <h1 class='text-6xl font-thin'>Welcome to Code Curio!</h1>
      <P5Demo />
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
        <br />
        <br />
        Sed blandit sodales dolor, eu elementum nisl sodales sit amet. Maecenas eget ipsum ut dui porta dignissim. Duis
        tincidunt mauris quis erat auctor dignissim. Curabitur ornare fringilla diam non mattis. Proin finibus eros
        justo, vel dignissim neque facilisis sit amet. Nulla facilisi. Quisque sit amet mi quis risus facilisis
        ultricies. Ut at consequat quam, in tempor tortor.
        <br />
        <br />
        Sed dignissim in tellus id blandit. Vivamus vitae ultricies odio. Sed ut luctus ligula. Curabitur eleifend justo
        nulla, eget aliquet leo rhoncus id. Integer in rhoncus massa. Praesent non dapibus tellus. Nulla dapibus
        imperdiet lectus sed eleifend. Nam et metus accumsan, dapibus nibh sit amet, tempus lacus. Nullam eget tincidunt
        sapien. Donec et libero sed leo maximus pharetra vehicula in quam. Integer sodales elementum augue, vel lacinia
        mauris luctus nec.
      </p>
    </main>
  )
}
