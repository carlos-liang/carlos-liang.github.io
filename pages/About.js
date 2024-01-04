import Image from "next/image";

const About = () => {
  const dashedBorderStyle = {
    borderWidth: '2px',
    borderStyle: 'dashed',
    borderColor: '#CBD5E0',
    borderRadius: '1rem',
    background: 'none',
    backgroundImage: 'none',
    padding: '1rem',
    lineDash: '8px',
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex items-center mt-36">
        <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-white mr-4">
          <Image
            src="/images/carlos.png"
            width={300}
            height={300}
            alt="Picture of the author"
            className="object-cover h-full w-full"
          />
        </div>
        <div>
          <h1 className="text-5xl font-bold">CARLOS LIANG</h1>
          <p className="text-lg">Artist/Software Developer</p>
        </div>
      </div>
      <div className="mt-8 flex items-center">
        <div className="transform -rotate-90 mb-16">
          <h2 className="text-2xl font-bold">INTRO</h2>
        </div>
        <div className="w-11/12" style={dashedBorderStyle}>
          <p className="text-lg">Hi! I'm Carlos Liang. I'm a computer scientist from Sydney with passion to create and inspire!</p>
          <br/>
          <p className="text-lg">I received my degree from UNSW.</p>
        </div>
      </div>
    </div>
  );
}

export default About;
