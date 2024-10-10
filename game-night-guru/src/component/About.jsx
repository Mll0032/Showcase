//About
import React from 'react';
import { FaLinkedin, FaGithub, FaReact, FaNodeJs, FaCss3Alt, FaHtml5 } from 'react-icons/fa';
import { SiMysql, SiExpress, SiBoardgamegeek, SiAxios } from 'react-icons/si';

const About = () => {
  return (
    <div className="about-page">
      <h1>About Game Night Nexus</h1>
      
      <section className="personal-info">
        <img src="https://media.licdn.com/dms/image/v2/C5603AQGbx1i-xFtWBQ/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1626375868743?e=1733961600&v=beta&t=qw1JR9YssotRB-q5PS7i5mhclzANWWsRFpfgEUqgdgA" />
        <h2>Matthew Lawson</h2>
        <div className="social-links">
          <a href="https://www.linkedin.com/in/matthew-lawson-68b83916/">
            <FaLinkedin /> LinkedIn
          </a>
          <a href="https://github.com/Mll0032/Showcase" target="_blank" rel="noopener noreferrer">
            <FaGithub /> GitHub Repository
          </a>
        </div>
      </section>

      <section className="project-info">
        <h2>About the Project</h2>
        <p>
          Game Night Nexus is a passion project born out of my love for board games and my desire to create a tool that enhances the board gaming experience. As an avid board game enthusiast, I often found myself struggling to organize game nights and keep track of my growing collection. This project aims to solve those problems and more.
        </p>
        <p>
          By building this application, I've not only created a useful tool for myself and other board game enthusiasts but I also honed my skills in full-stack web development.
        </p>
        <p>
          The main functionality of Game Night Nexus includes:
        </p>
        <ul>
          <li>Managing and displaying your board game collection</li>
          <li>Importing your BoardGameGeek library</li>
          <li>Searching and adding individual games to your collection</li>
          <li>Providing game suggestions based on player count and available time</li>
        </ul>
        <p>
          If you have a boardgamegeek.com account feel free to use your username to upload your library. If not use this one: Lanc1988
        </p>
      </section>

      <section className="tech-stack">
        <h2>Technology Stack</h2>
        <div className="tech-icons">
          <div className="tech-icon">
            <FaReact />
            <span>React.js</span>
          </div>
          <div className="tech-icon">
            <FaNodeJs />
            <span>Node.js</span>
          </div>
          <div className="tech-icon">
            <SiExpress />
            <span>Express.js</span>
          </div>
          <div className="tech-icon">
            <SiMysql />
            <span>MySQL</span>
          </div>
          <div className="tech-icon">
            <FaCss3Alt />
            <span>CSS3</span>
          </div>
          <div className="tech-icon">
            <FaHtml5 />
            <span>HTML5</span>
          </div>
          <div className="tech-icon">
            <SiBoardgamegeek />
            <span>BoardGameGeek API</span>
          </div>
          <div className="tech-icon">
            <SiAxios />
            <span>Axios</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;