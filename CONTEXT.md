# Physics Figures

Physics Figures (physicsfigures.com) is a directory of generators that make
clean, printable physics figures for teachers to paste into tests, worksheets
and slides. It is a teacher.dev project.

## Language

### The directory

**Figure**:
A finished physics picture a teacher puts in front of students, such as a coil with a moving magnet or a block on an inclined plane.
_Avoid_: Graphic, image, visual, resource, diagram (except inside a figure's standard name, such as a free body diagram or circuit diagram, where it stays in the generator's name and search words)

**Generator**:
A page that makes one kind of figure from a teacher's settings, named "<Figure> Generator".
_Avoid_: Maker, tool, builder, app

**Directory**:
The home page, which lists every generator with a live preview of its figure. There are no generators yet, so it shows only the card for a generator request.
_Avoid_: Catalog, gallery, index

**Generator request**:
A teacher asking for a kind of figure that no generator makes yet.
_Avoid_: Feature request, suggestion

### Parts of every figure

**Object**:
A block, ball, cart or hanging mass in a figure. Its drawn size is its own setting, apart from its label, and every object starts the same size, so a 5 kg block isn't bigger than a 2 kg one unless the teacher makes it so.
_Avoid_: Mass (for the thing drawn; fine inside a label), body, item

**Mirror**:
A generator's one switch that flips its figure left to right, so a ramp rises the other way or a magnet comes from the other side. Letters and numbers stay readable, and N and S keep their meaning.
_Avoid_: Flip, reverse, direction

**Label**:
Text drawn beside a part of a figure, such as m₁, 5 kg, 30°, θ, N or S. Each one can be written text, a blank line for students to fill in, or left off.
_Avoid_: Caption, tag, annotation

**Vector**:
An arrow drawn on a figure for a force, velocity or acceleration, such as gravity on a block or the motion of a magnet. It is drawn about the right size, not to scale, looks the same in every generator, and has its own label. Forces are solid; velocity and acceleration have a dashed shaft at full weight, so they're never read as forces, even photocopied. On a Free Body Diagram the teacher sets each force's length relative to the others, so equal forces are drawn equal.
_Avoid_: Arrow (alone), force line

**Chart title**:
The title across the top of a figure.
_Avoid_: Title (alone), heading

**Preset**:
A named set of settings for one generator, saved by the teacher in their browser. None are built in.
_Avoid_: Template, favorite

### Coil and Magnet

**Coil and Magnet**:
A figure of a coil of wire seen from the side, with a bar magnet, a battery or nothing beside it, for electromagnetic induction and electromagnets. Its generator is the Coil and Magnet Generator.
_Avoid_: Induction diagram, solenoid (fine as a search word)

**Field line**:
A curve showing the direction of a magnetic field, with arrowheads along it. Field lines follow the real shape of the field, so they never cross.
_Avoid_: Flux line, field arrow

**Meter**:
The galvanometer that can be wired to a coil, with its needle to the left, right, centered or blank.
_Avoid_: Ammeter, gauge

**Current arrow**:
A small arrow on a coil's wire showing which way the current flows. It often gives away the answer, so it can be turned off.
_Avoid_: Current direction, flow arrow

### Inclined Plane

**Inclined Plane**:
A figure of a ramp at an angle with one object on it: a block, a ball or a cart. Its generator is the Inclined Plane Generator. A ramp with a string on it belongs to the Pulley.
_Avoid_: Ramp (fine as a search word), slope, wedge

### Pulley

**Pulley**:
A figure of objects connected by string over one or more pulleys, in one of its setups. Its generator is the Pulley Generator. Every figure with a string is a Pulley figure.
_Avoid_: Pulley system, rope diagram

**Setup**:
One arrangement a Pulley figure can take: Atwood machine (two hanging objects over one fixed pulley), table and hanging mass, ramp and hanging mass, or block and tackle (one load held by 1 to 4 strands).
_Avoid_: Mode, type, scenario

### Free Body Diagram

**Free Body Diagram**:
A figure of one body alone, a dot or an Object, with every force on it drawn from its middle and nothing around it: no ramp, string or floor. Its generator is the Free Body Diagram Generator. The ramp or pulley a problem is about is an Inclined Plane or Pulley figure; its free body diagram is this one.
_Avoid_: Force diagram (fine as a search word), FBD (fine as a search word)

**Body**:
What a Free Body Diagram is of: a dot (the usual AP convention) or a block, ball or cart. It has no label.
_Avoid_: Particle, point mass

**Force list**:
The forces on a Free Body Diagram, up to eight, each with its own angle (counterclockwise from the right), length relative to the others, and label. Starter buttons add the usual ones (gravity, normal, friction, tension, applied, spring, air resistance) pointing the usual way.
_Avoid_: Force slots

**Angle mark**:
An arc on a Free Body Diagram between an angled force and a dashed horizontal or vertical reference line, with its own label, measured from the nearer half of that line.
_Avoid_: Angle arc (alone)

**Component**:
One of the two thinner, dashed, lighter arrows along the horizontal and vertical that add up to an angled force. Components often give away the answer, so each force's are off unless turned on.
_Avoid_: Projection, part

### Circuit Diagram

**Circuit Diagram**:
A schematic of one closed loop of parts, some of them in parallel groups, for current, resistance and Kirchhoff problems. Its generator is the Circuit Diagram Generator. It is drawn from a series/parallel tree, not placed by hand (ADR 0004).
_Avoid_: Circuit (alone, for the figure), schematic (fine as a search word), wiring diagram

**Part**:
One symbol on a circuit diagram: a battery, resistor, bulb, switch or ammeter. Each has a name label (R₁) and a value label (4 Ω). Names are numbered automatically until the teacher types one. A voltmeter is not a part: it goes across a part or group.
_Avoid_: Component, element, device

**Group**:
Parts joined in series or in parallel inside a circuit. A parallel group holds two or more branches.
_Avoid_: Block, cluster, sub-circuit

**Branch**:
A run of wire that carries one current: the main loop, or one branch of a parallel group. A current arrow belongs to a branch.
_Avoid_: Path, leg, rung (except for the drawing of a ladder)

**Point**:
A lettered dot on a wire (A, B…), for questions like "the potential difference between A and B". Points sit in the gaps between parts.
_Avoid_: Node, junction (a junction is where wires meet, drawn as a dot with no letter), terminal

**Symbol style**:
US symbols (a zigzag resistor, a bulb with a looped filament) or IEC symbols (a box resistor, a bulb with a cross).
_Avoid_: Standard, notation
