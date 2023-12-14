import Image from "next/image";

const About = () => {
  const dashedBorderStyle = {
    borderWidth: '2px',
    borderStyle: 'dashed',
    borderColor: '#CBD5E0',
    borderRadius: '0.25rem',
    background: 'none',
    backgroundImage: 'none',
    padding: '1rem', // Adjust padding as needed
    lineDash: '8px', // Customize dash length here
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex items-center">
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
          <h1 className="text-4xl font-bold">Carlos Liang</h1>
          <p className="text-lg">Your description goes here...</p>
        </div>
      </div>
      <div className="mt-8 flex items-center">
        <div className="w-1/12 transform -rotate-90">
          <h2 className="text-2xl font-bold">Intro</h2>
        </div>
        <div className="w-11/12" style={dashedBorderStyle}>
          <p className="text-lg">Additional details about yourself...</p>
        </div>
      </div>
    </div>
  );
}

export default About;
