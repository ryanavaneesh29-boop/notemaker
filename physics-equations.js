const equationGrid = document.querySelector("#equationGrid");

const physicsEquations = [
  ["Kinetic energy", "E<sub>k</sub> = 0.5mv<sup>2</sup>"],
  ["Gravitational potential energy", "E<sub>p</sub> = mgh"],
  ["Elastic potential energy", "E<sub>e</sub> = 0.5ke<sup>2</sup>"],
  ["Change in thermal energy", "&Delta;E = mc&Delta;&theta;"],
  ["Power from energy transfer", "P = E/t"],
  ["Power from work done", "P = W/t"],
  ["Efficiency", "efficiency = useful output / total input"],
  ["Wave speed", "v = f&lambda;"],
  ["Charge flow", "Q = It"],
  ["Potential difference", "V = IR"],
  ["Electrical power", "P = VI"],
  ["Electrical power from current and resistance", "P = I<sup>2</sup>R"],
  ["Energy transferred", "E = Pt"],
  ["Energy from charge and potential difference", "E = QV"],
  ["Density", "&rho; = m/V"],
  ["Pressure in a liquid", "p = h&rho;g", "HT"],
  ["SUVAT", "v<sup>2</sup> - u<sup>2</sup> = 2as"],
  ["Force and momentum", "F = m&Delta;v/&Delta;t", "HT"],
  ["Period", "T = 1/f"],
  ["Magnification", "magnification = image height / object height"],
  ["Force on a conductor", "F = BIl", "HT"],
  ["Transformer", "V<sub>p</sub>/V<sub>s</sub> = n<sub>p</sub>/n<sub>s</sub>", "HT"],
  ["Gas pressure and volume", "pV = constant"]
];

physicsEquations.forEach(([name, equation, tier]) => {
  const card = document.createElement("div");
  card.className = "equation-card";
  card.innerHTML = `
    <strong>${name}</strong>
    <code>${equation}</code>
    ${tier ? `<span>${tier}</span>` : ""}
  `;
  equationGrid.appendChild(card);
});
