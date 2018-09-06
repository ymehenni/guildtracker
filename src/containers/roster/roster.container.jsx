import React, { Component } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import _ from 'lodash';

// a little function to help us with reordering the result
const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

/**
 * Moves an item from one list to another list.
 */
const move = (source, destination, droppableSource, droppableDestination) => {
  const sourceClone = Array.from(source);
  const destClone = Array.from(destination);
  const [removed] = sourceClone.splice(droppableSource.index, 1);

  destClone.splice(droppableDestination.index, 0, removed);

  const result = {};
  result[droppableSource.droppableId] = sourceClone;
  result[droppableDestination.droppableId] = destClone;

  return result;
};

const grid = 8;

const getItemStyle = (isDragging, draggableStyle) => ({
  // some basic styles to make the items look a bit nicer
  userSelect: 'none',
  padding: grid * 2,
  margin: `0 0 ${grid}px 0`,
  borderRadius: '5px',

  // change background colour if dragging
  background: isDragging ? 'lightgreen' : '#FFFFFF',

  // styles we need to apply on draggables
  ...draggableStyle
});

const getListStyle = isDraggingOver => ({
  background: isDraggingOver ? '#009CEA' : '#1873D8',
  padding: grid,
  width: 400,
  height: '70vh',
  overflowY: 'auto'
});

const createMemberListing = (member, realm) => {
  return (
    <div className="media">
      <figure className="image is-32x32 media-left">
        <img
          className="is-rounded"
          alt={'character portrait for ' + member.character.name}
          src={
            'https://render-us.worldofwarcraft.com/character/' +
            member.character.thumbnail
          }
        />
      </figure>
      <span className="media-content">
        <a
          href={`https://worldofwarcraft.com/en-us/character/${realm.replace(
            /\W/g,
            ''
          )}/${member.character.name}`}
          target="_blank"
        >
          {member.character.name}
          &nbsp;
          <span className="icon has-text-info">
            <img
              className="image is-16x16"
              alt="world of warcraft logo"
              src="/wow.png"
            />
          </span>
        </a>
        <a
          href={`https://www.warcraftlogs.com/character/us/${realm.replace(
            /\W/g,
            ''
          )}/${member.character.name}`}
          target="_blank"
        >
          <span className="icon has-text-info">
            <img
              className="image is-16x16"
              alt="warcraft logs logo"
              src="/logs.png"
            />
          </span>
        </a>
        <a
          href={`https://raider.io/characters/us/${realm.replace(/\W/g, '')}/${
            member.character.name
          }`}
          target="_blank"
        >
          <span className="icon has-text-info">
            <img
              className="image is-16x16"
              alt="raider io logo"
              src="/raider.png"
            />
          </span>
        </a>
      </span>
      <span className="media-right level">
        {' '}
        <figure className="image is-16x16">
          <img
            className="is-rounded"
            alt={'character portrait for ' + member.character.name}
            src={
              'https://render-us.worldofwarcraft.com/icons/56/' +
              _.get(member, 'character.spec.icon') +
              '.jpg'
            }
          />
        </figure>
        &nbsp;
        {'Rank ' + member.rank}
      </span>
    </div>
  );
};

export class Roster extends Component {
  state = {
    items: [
      {
        id: -1,
        content: (
          <span>
            <i className="fas fa-pulse fa-cog fa-spinner" /> Loading Guild
            Members
          </span>
        )
      }
    ],
    selected: [],
    guildName: 'baewatch',
    realName: 'malganis'
  };

  /**
   * A semi-generic way to handle multiple lists. Matches
   * the IDs of the droppable container to the names of the
   * source arrays stored in the state.
   */
  id2List = {
    droppable: 'items',
    droppable2: 'selected'
  };

  getList = id => this.state[this.id2List[id]];

  onDragEnd = result => {
    const { source, destination } = result;

    // dropped outside the list
    if (!destination) {
      return;
    }

    if (source.droppableId === destination.droppableId) {
      const items = reorder(
        this.getList(source.droppableId),
        source.index,
        destination.index
      );

      let state = { items };

      if (source.droppableId === 'droppable2') {
        state = { selected: items };
      }

      this.setState(state);
    } else {
      const result = move(
        this.getList(source.droppableId),
        this.getList(destination.droppableId),
        source,
        destination
      );

      this.setState({
        items: result.droppable,
        selected: result.droppable2
      });
    }
  };

  getRoster = async (guild, realm) => {
    console.log('getting guild', guild, realm);
    const queryString = `/guild?guild=${guild}&realm=${realm}`;
    const response = await fetch(queryString, { method: 'GET' });
    const parsedReponse = await response.json();
    const status = parsedReponse.status;
    const roster = parsedReponse.members;
    console.log(roster);

    const formattedMembers = _.map(roster, (member, i) => {
      return {
        id: i,
        content: createMemberListing(member, realm)
      };
    });

    this.setState({
      status: status,
      items: formattedMembers
    });
    return roster;
  };

  async componentDidMount() {
    await this.getRoster(this.state.guildName, this.state.realName);
  }
  // Normally you would want to split things out into separate components.
  // But in this example everything is just done in one place for simplicity
  render() {
    return (
      <section className="hero is-light is-fullheight">
        <div className="hero-body">
          <div className="container">
            <h1 className="title">Select roster</h1>
            <h2 className="subtitle">Drag up to 30 players</h2>
            {this.state.status && (
              <div className="section centerContainer">
                <span className="tag is-danger is-large">
                  {this.state.status}
                </span>
              </div>
            )}
            <DragDropContext onDragEnd={this.onDragEnd}>
              <div className="tile is-parent">
                <div className="tile is-child">
                  <Droppable droppableId="droppable">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        style={getListStyle(snapshot.isDraggingOver)}
                      >
                        {this.state.items.map((item, index) => (
                          <Draggable
                            key={item.id}
                            draggableId={item.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={getItemStyle(
                                  snapshot.isDragging,
                                  provided.draggableProps.style
                                )}
                              >
                                {item.content}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
                <div className="is-child">
                  <Droppable droppableId="droppable2">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        style={getListStyle(snapshot.isDraggingOver)}
                      >
                        {this.state.selected.map((item, index) => (
                          <Draggable
                            key={item.id}
                            draggableId={item.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={getItemStyle(
                                  snapshot.isDragging,
                                  provided.draggableProps.style
                                )}
                              >
                                {item.content}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>
            </DragDropContext>
          </div>
        </div>
      </section>
    );
  }
}
